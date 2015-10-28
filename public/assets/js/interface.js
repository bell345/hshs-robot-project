/**
 * Created by thomas on 2015-10-26 at 21:11.
 *
 * MIT Licensed
 */

var uiConfig;

function keyToUI(event) {
    var key = event.which;

    var $controls = $(".move-robot-control"),
        filter = null;

    switch (key) {
        case Keys.UP:
        case Keys.W:
            filter = ".forwards";
            break;
        case Keys.DOWN:
        case Keys.S:
            filter = ".backwards";
            break;
        case Keys.LEFT:
        case Keys.A:
            filter = ".left";
            break;
        case Keys.RIGHT:
        case Keys.D:
            filter = ".right";
            break;
        case Keys.SPACE:
            filter = ".stop";
            break;
        default:
            break;
    }

    if (filter !== null) {
        var $ui = $controls.filter(filter);
        if ($ui.length) return $ui;
        else return null;
    } else return null;
}

var feedEnabled = true;

function queryString(opts) {
    var str = "";
    for (var prop in opts) if (opts.hasOwnProperty(prop))
        str += (str.length == 0 ? "" : "&") + prop + "=" + opts[prop];
    return str;
}

function updateCameraFeed() {
    if (feedEnabled)
        $(".image-feed").attr("src",
            "/api/v1/camera/" + (uiConfig.useMJPEG ? "mjpeg" : "jpeg")
            + "?" + queryString({
                t: new Date().getTime(),
                delay: uiConfig.jpegRefreshDelay
            }));

    window.setTimeout(updateCameraFeed, uiConfig.useMJPEG
        ? uiConfig.mjpegRefreshDelay
        : uiConfig.jpegRefreshDelay);
}

function getCameraConfig(callback) {
    $.ajax({
        url: "/api/v1/camera/config",
        success: function (response, status, xhr) {
            callback(response);
        },
        error: function (xhr, status, error) {
            reportError("Failed to get camera configuration.", xhr)
        }
    });
}

function reportError(message, error) {
    if (error.responseJSON) error = error.responseJSON;
    else if (error.responseText) try {
        error = JSON.parse(error.responseText);
    } catch (e) {}
    else if (error.statusText) error = error.statusText;

    $(".shadow").addClass("show");
    var $note = $(".fullscreen-notification");
    $note.find("h2").html("An error occurred.");
    $note.find("div.body").html(
        "<p>" + message + "</p>"
        + (error
            ? "<pre><code>" + (error.error_description || error) + "</code></pre>"
            : "")
    );
}

function getHumanReadableOption(optionName) {
    var words = optionName.split("_");
    var hrstring = "",
        specialWords = {
            "hflip": "Horizontal Flip",
            "vflip": "Vertical Flip",
            "iso": "ISO",
            "anno": "Annotation",
            "anno3": "Annotation",
            "fps": "FPS",
            "tl": "TL",
            "w": "Width",
            "h": "Height",
            "num": "Number"
        };
    for (var i=0;i<words.length;i++) {
        var word = words[i];
        if (specialWords[word]) hrstring += specialWords[word];
        else {
            hrstring += words[i][0].toUpperCase();
            if (words[i].length > 1)
                hrstring += words[i].slice(1);
        }
        if (i !== words.length - 1)
            hrstring += " ";
    }

    return hrstring;
}

function OptionSelect(prefix) {
    this.prefix = prefix;
    this.getConfig = function () { return {}; };
    this.setConfig = function (os, c) { };
    this.humanise = function (e) { return e; };
    this.limitedOptions = {};

    this.get = function () {
        return $("."+this.prefix+"-option-select");
    };
    this.getInputs = function () {
        return $("."+this.prefix+"-option-input");
    };
    this.getActiveInput = function () {
        return this.getInputs().filter(".show");
    };
    this.getContainer = function () {
        return $("."+this.prefix+"-config");
    };
    this.fill = function () {
        var $os = this.get();

        $os.empty().trigger("change");

        var self = this;
        self.getConfig(function (config) {
            TBI.UI.fillSelect($os[0], config, function (option, key, value) {
                option.value = key;
                option.dataset.value = value;
                option.dataset.originalValue = value;
                option.innerHTML = self.humanise(key);
            });
            self.get().val("-").trigger("update");
        });
    };
    this.getChanges = function () {
        var options = this.get().find("option");
        if (options.length > 1) {
            var obj = {};
            for (var i=0;i<options.length;i++) {
                if (options[i].dataset.originalValue &&
                    options[i].dataset.value !== options[i].dataset.originalValue)
                    obj[options[i].value] = options[i].dataset.value;
            }

            return obj;
        } else return {};
    };

    this.submitOption = function () {
        var input = this.getActiveInput(),
            prevOption = this.get().find("option")
                .filter("[value='"+input.data("name")+"']");

        switch (true) {
            case input.hasClass("option-bool-input"):
                prevOption.attr("data-value", input[0].checked ? "true" : "false");
                break;
            default:
                prevOption.attr("data-value", input.val());
        }
    };

    this.update = function () {
        var curr = this.get().val();

        this.submitOption();

        var option = this.get().find("option").filter("[value='"+curr+"']"),
            val = option.attr("data-value");

        this.getInputs().removeClass("show");
        this.getContainer().find(".styled-select").removeClass("show");

        if (isNull(curr) || curr == "-") return;

        // prepare current value
        switch (true) {
            case this.limitedOptions[option.val()] !== undefined:
                var select = this.getInputs().filter(".option-select-input");

                TBI.UI.fillSelect(select[0], this.limitedOptions[option.val()],
                    function (option, i, value) {
                        option.innerHTML = value;
                        option.value = value;
                });
                select.parent().addClass("show")
                    .find("select")
                    .data("name", option.val())
                    .addClass("show")
                    .val(val)
                    .trigger("change");

                break;
            case val === "false":
            case val === "true":
                this.getInputs().filter(".option-bool-input")
                    .addClass("show")
                    .data("name", option.val())[0]
                    .checked = (val === "true");

                break;
            case !isNaN(parseFloat(val)):
                this.getInputs().filter(".option-number-input")
                    .addClass("show")
                    .data("name", option.val())
                    .val(parseFloat(val));

                break;
            default:
                this.getInputs().filter(".option-text-input")
                    .addClass("show")
                    .data("name", option.val())
                    .val(val);
        }

        if (Object.keys(this.getChanges()).length)
            this.getContainer().find(".option-submit").show();
        else
            this.getContainer().find(".option-submit").hide();

    };

    var self = this;
    this.get().on("change", function () {
        self.update();
    });

    this.getInputs().on("change", function () {
        self.update();
    });

    this.getContainer().find(".option-submit").click(function () {
        self.submitOption();
        self.setConfig(self, self.getChanges(), function () {});
    });
    this.getContainer().find(".option-revert").click(function () {
        self.fill();
    });
}

var LimitedOptions = {
    exposure_mode: [
        "off",
        "auto",
        "night",
        "nightpreview",
        "backlight",
        "spotlight",
        "sports",
        "snow",
        "beach",
        "verylong",
        "fixedfps",
        "antishake",
        "fireworks"
    ],
    metering_mode: [
        "average",
        "spot",
        "backlit",
        "matrix"
    ],
    white_balance: [
        "off",
        "auto",
        "sun",
        "cloudy",
        "shade",
        "tungsten",
        "fluorescent",
        "incandescent",
        "flash",
        "horizon"
    ],
    image_effect: [
        "none",
        "negative",
        "solarise",
        "sketch",
        "denoise",
        "emboss",
        "oilpaint",
        "hatch",
        "gpen",
        "pastel",
        "watercolour",
        "film",
        "blur",
        "saturation",
        "colourswap",
        "washedout",
        "posterise",
        "colourpoint",
        "colourbalance",
        "cartoon"
    ],
    autostart: [
        "standard",
        "idle"
    ],
    MP4Box: [
        "background",
        "false"
    ]
};

function refreshCamera() {
    var $ip = $(".image-port");
    $ip.addClass("loading");
    feedEnabled = false;

    $.ajax({
        method: "POST",
        url: "/api/v1/camera/restart",
        success: function (response, status, xhr) {
            $(".restart-camera").attr("disabled", false);
            $ip.removeClass("loading");
            feedEnabled = true;
        },
        error: function (xhr, status, error) {
            console.log(xhr.responseText);
            reportError("Failed to restart camera.", xhr);
            feedEnabled = true;
        }
    });
}

$(function () {
Require(["assets/js/tblib/loader.js",
         "assets/js/tblib/ui.js"], function () {

    if (!localStorage.getItem("robot-project-ui-config"))
        uiConfig = {
            "useMJPEG": true,
            "jpegRefreshDelay": 300,
            "mjpegRefreshDelay": 5000
        };
    else uiConfig =
        JSON.parse(localStorage.getItem("robot-project-ui-config"));

    $(window).on("beforeunload", function () {
        localStorage.setItem("robot-project-ui-config",
            JSON.stringify(uiConfig));
    });

    loader.start();

    $(document).on("pageload", function () {
        TBI.UI.updateUI();
        $("button[data-icon-src]").each(function () {
            var self = $(this);

            var src = self.attr("data-icon-src");
            $.ajax({
                url: src,
                success: function (response) {
                    self[0].appendChild(response.documentElement);
                }
            });
        });

        $(".logout").click(function () {
            eraseCookie("access_token");
            location.reload();
        });

        $(".image-feed").on("load", function () {
            if ($(this).attr("src") !== "/assets/res/missing.png") {
                $(this).parent().removeClass("loading");
                feedEnabled = true;
            }
        }).on("error", function () {
            if ($(this).attr("src") !== "/assets/res/missing.png")
                $(this).attr("src", "/assets/res/missing.png");
        });

        $(".image-port").on("click", function () {
            if (Fullscreen.get() !== null) {
                Fullscreen.release();
                $(this).removeClass("fullscreen");
            }
        });

        $(document).on("keydown", function (event) {
            var el = keyToUI(event);

            if (el) {
                el.addClass("active");
                el.trigger("keydown");
                return false;
            }
        });

        $(document).on("keyup", function (event) {
            var el = keyToUI(event);

            if (el) {
                el.removeClass("active");
                el.trigger("keyup");
                el.trigger("click");
                return false;
            }
        });

        $(".restart-camera").click(function () {
            var $self = $(this);
            if (!$self.attr("disabled")) {
                refreshCamera();
                $self.attr("disabled", true);
            }
        });

        var cameraOptionSelect = new OptionSelect("camera");
        cameraOptionSelect.getConfig = getCameraConfig;
        cameraOptionSelect.setConfig = function (os, changes, callback) {
            if (Object.keys(changes).length) {
                $.ajax({
                    method: "PUT",
                    url: "/api/v1/camera/config",
                    data: JSON.stringify(changes),
                    contentType: "application/json",
                    success: function (response, status, xhr) {
                        os.fill();
                        refreshCamera();
                        callback();
                    },
                    error: function (xhr, status, error) {
                        reportError("Failed to save camera configuration.", xhr);
                    }
                });

                TBI.UI.updateSelect(os.get()[0], {});
                os.get().val("-").trigger("change");
            }
        };
        cameraOptionSelect.limitedOptions = LimitedOptions;
        cameraOptionSelect.humanise = getHumanReadableOption;
        cameraOptionSelect.fill();

        var uiOptionSelect = new OptionSelect("ui");
        uiOptionSelect.getConfig = function (callback) {
            callback(uiConfig);
        };
        uiOptionSelect.setConfig = function (os, changes, callback) {
            if (Object.keys(changes).length) {
                TBI.UI.updateSelect(os.get()[0], {});
                os.get().val("-").trigger("change");

                for (var prop in changes) if (changes.hasOwnProperty(prop)) {
                    if (changes[prop] == "true")
                        uiConfig[prop] = true;

                    else if (changes[prop] == "false")
                        uiConfig[prop] = false;

                    else if (!isNaN(parseFloat(changes[prop])))
                        uiConfig[prop] = parseFloat(changes[prop]);

                    else uiConfig[prop] = changes[prop];
                }

                os.fill();
                callback();
            }
        };
        uiOptionSelect.fill();

        $(".toggle-fullscreen").click(function () {
            var $ip = $(".image-port");

            var fullscreenInterval = setInterval(function () {
                if (!Fullscreen.check()) {
                    $ip.removeClass("fullscreen");
                    clearInterval(fullscreenInterval);
                }
            }, 100);

            Fullscreen.set(document.documentElement);
            $ip.addClass("fullscreen");
        });

        window.setInterval(function () {
            var now = new Date();
            $(".clock").html(
                zeroPrefix(now.getHours()) + ":"
                + zeroPrefix(now.getMinutes()) + ":"
                + zeroPrefix(now.getSeconds())
                + "<span class='milliseconds'>."
                + zeroPrefix(now.getMilliseconds(), 3)
                + "</span>"
            );
        }, 10);

        updateCameraFeed();
    });
});
});