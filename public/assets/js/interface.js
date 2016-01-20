/**
 * Created by thomas on 2015-10-26 at 21:11.
 *
 * MIT Licensed
 */

var uiConfig, wm;

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
                delay: uiConfig.jpegRefreshDelay,
                timeout: uiConfig.mjpegRefreshDelay
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
    if (!error) error = null;
    else if (error.responseJSON) error = error.responseJSON;
    else if (error.responseText) try {
        error = JSON.parse(error.responseText);
    } catch (e) { error = error.responseText; }
    else if (error.statusText) error = error.statusText;

    var errtext = error
        ? "<pre><code>" + (error.error_description || error) + "</code></pre>"
        : "";

    wm.spawn(JSWM.Dialog, "An error occurred.",
        "<p>" + message + "</p>" +
        errtext,
        { x: "25%", y: "25%", width: "50%", height: "50%",
            shadow: true, dialogOptions: JSWM.DialogOptions.ok }
    );

    //$(".shadow").addClass("show");
    //var $note = $(".fullscreen-notification");
    //$note.find("h2").html("An error occurred.");
    //$note.find("div.body").html(
    //    "<p>" + message + "</p>"
    //    + (error
    //        ? "<pre><code>" + (error.error_description || error) + "</code></pre>"
    //        : "")
    //);
}

function getHumanReadableOption(optionName) {
    var words = optionName.split("_");
    var hrstring = "",
        specialWords = {
            hflip: "Horizontal Flip",
            vflip: "Vertical Flip",
            iso:   "ISO",
            anno:  "Annotation",
            anno3: "Annotation",
            fps:   "FPS",
            tl:    "TL",
            w:     "Width",
            h:     "Height",
            num:   "Number"
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
            //$ip.removeClass("loading");
            feedEnabled = true;
        },
        error: function (xhr, status, error) {
            console.log(xhr.responseText);
            reportError("Failed to restart camera.", xhr);
            feedEnabled = true;
        }
    });
}
function restartServer() {
    var $ip = $(".image-port");
    $ip.addClass("loading");
    $(".image-feed").attr("src", "/assets/res/missing.png");
    feedEnabled = false;

    $.ajax({
        method: "POST",
        url: "/api/v1/admin/restart",
        success: function (response, status, xhr) {
            $(".restart-server").attr("disabled", false);
            //$ip.removeClass("loading");
            feedEnabled = true;
        },
        error: function (xhr, status, error) {
            console.log(xhr.responseText);
            reportError("Failed to restart server.", xhr);
            feedEnabled = true;
        }
    })
}

function makeMotorRequest(speed, direction, callback) {
    var options = {};
    if (!isNull(speed)) options["speed"] = speed;
    if (!isNull(direction)) options["direction"] = direction;
    $.ajax({
        method: "POST",
        url: "/api/v1/motor/control",
        data: JSON.stringify(options),
        contentType: "application/json",
        success: function (response, status, xhr) {
            callback(response, status, xhr);
        },
        error: function (xhr, status, error) {
            console.log(xhr);
            reportError("Failed to update motor control.", xhr);
        }
    })
}

function SettingsGroup(name) {
    this.title = name;
    this.getConfig = function (f) { return f({}); };
    this.setConfig = function (sg, o, f) { f(); };
    this.humanise = function (e) { return e; };
    this.limitedOptions = {};
    this.rangeOptions = {};

    var self = this;
    this.generate = function (win) {
        self.getConfig(function (conf) {
            var body = $(win.element).find(".window-body")[0],
                setid = generateUUID(),
                header = document.createElement("h2");
                header.innerHTML = "<a href='#' class='up-down on' for='#"+setid+"'>" +
                    self.title + "</a>";
            body.appendChild(header);

            var section = document.createElement("section");
                section.id = setid;
            body.appendChild(section);

            for (var prop in conf) if (conf.hasOwnProperty(prop)) {
                var val = conf[prop],
                    id = generateUUID(),
                    row = document.createElement("div");
                row.className = "control-row";
                section.appendChild(row);

                var label = document.createElement("label");
                $(label).attr("for", id)
                    .text(self.humanise(prop));

                var prepareInput = function (type, row, prop, id, val) {
                    var input = document.createElement("input");
                        input.type = type;
                    row.appendChild(input);
                        if (type == "checkbox")
                            input.checked = input.dataset.originalValue =
                                val.toString() === "true";
                        else input.value = input.dataset.originalValue = val;

                        input.id = id;
                        input.dataset.option = self.title + "/" + prop;
                    return input;
                };

                switch (true) {
                    case self.rangeOptions[prop] instanceof Array
                            && self.rangeOptions[prop].length >= 2:
                        label.className = "small-label";
                        row.appendChild(label);

                        var ro = self.rangeOptions[prop];
                        var range = prepareInput("range", row, prop, id, val);
                            range.min = ro[0];
                            range.max = ro[1];
                            if (ro.length > 2) range.step = ro[2];
                            else range.step = (ro[1] - ro[0]) / 100;
                            range.value = val;
                        break;

                    case self.limitedOptions[prop] instanceof Object:
                        label.className = "small-label";
                        row.appendChild(label);

                        var select = document.createElement("select");
                            select.className = "styled";
                            select.dataset.option = self.title + "/" + prop;
                            select.id = id;
                        row.appendChild(select);

                        TBI.UI.updateUI();
                        TBI.UI.fillSelect(select, self.limitedOptions[prop],
                            function (option, i, value) {
                                option.innerHTML = value;
                                option.value = value;
                            }
                        );
                        $(select)
                            .data("originalValue", val)
                            .val(val).trigger("change");
                        break;

                    case val === "true":
                    case val === "false":
                    case typeof val == typeof true:
                        prepareInput("checkbox", row, prop, id, val);
                        row.appendChild(label);
                        break;

                    case !isNaN(parseFloat(val)):
                    case typeof val == typeof 1:
                        label.className = "small-label";
                        row.appendChild(label);
                        prepareInput("number", row, prop, id, val);
                        break;

                    default:
                        label.className = "small-label";
                        row.appendChild(label);
                        prepareInput("text", row, prop, id, val);
                        break;

                }
            }

            TBI.UI.updateUI();
        });
    };

    this.getChanges = function (win) {
        var inputs = $(win.element).find("[data-option^='" + self.title + "/']"),
            conf = {};

        inputs.each(function (i, e) {
            var prop = $(e).data("option").split("/")[1],
                val = $(e).val(),
                d = $(e).data("originalValue");

            if (d != undefined) d = d.toString();
            switch (e.nodeName.toLowerCase()) {
                case "input": switch (e.type) {
                    case "checkbox":
                        if (e.checked !== (d === "true"))
                            conf[prop] = e.checked;
                        break;
                    case "number":
                    case "range":
                        if (val !== d)
                            conf[prop] = parseFloat(val);
                        break;
                    default:
                        if (val !== d)
                            conf[prop] = $(e).val();
                } break;
                default:
                    if (val !== d)
                        conf[prop] = $(e).val();
            }
        });

        return conf;
    };

    this.update = function (win) {
        self.setConfig(self, self.getChanges(win), function () {});
    };
}

function saveUIConfig() {
    localStorage.setItem("robot-project-ui-config",
        JSON.stringify(uiConfig));
}

$(function () {
Require(["assets/js/tblib/loader.js",
         "assets/js/tblib/ui.js",
         "assets/js/jswm2.js"], function () {

    try {
        uiConfig =
            JSON.parse(localStorage.getItem("robot-project-ui-config"));
        if (isNull(uiConfig))
            throw new Error();
    } catch (e) {
        uiConfig = {
            "useMJPEG": true,
            "jpegRefreshDelay": 100,
            "mjpegRefreshDelay": 5000,
            "motorMaxSpeed": 1,
            "motorTurnMagnitude": 1
        };
        saveUIConfig();
    }
    //$(window).on("beforeunload", function () {
    //    localStorage.setItem("robot-project-ui-config",
    //        JSON.stringify(uiConfig));
    //});

    loader.start();

    $(document).on("pageload", function () {
        wm = new JSWM($(".dialog-container")[0]);
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

        var kbEventsValid = true;
        $(".motor-controls, .image-port")
            .on("mouseenter", function () { kbEventsValid = true; })
            .on("mouseleave", function () { kbEventsValid = false; });

        $(document).on("keydown", function (event) {
            if (!kbEventsValid) return true;
            var el = keyToUI(event);

            if (el) {
                el.trigger("keydown", event);
                el.addClass("active");
                //return false;
            }
        });

        $(document).on("keyup", function (event) {
            if (!kbEventsValid) return true;
            var el = keyToUI(event);

            if (el) {
                el.removeClass("active");
                el.trigger("keyup", event);
                el.trigger("click", event);
                //return false;
            }
        });

        $(".restart-camera").click(function () {
            var $self = $(this);
            if (!$self.attr("disabled")) {
                refreshCamera();
                $self.attr("disabled", true);
            }
        });

        $(".restart-server").click(function () {
            var $self = $(this);
            if (!$self.attr("disabled")) {
                restartServer();
                $self.attr("disabled", true);
            }
        });

        $(".toggle-controls").click(function () {
            if (TBI.UI.isToggled(this))
                $(".motor-controls").removeClass("closed");
            else $(".motor-controls").addClass("closed");
        });

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

        $(".open-settings").click(function () {
            var settingGroups = [],
                window = wm.spawn(JSWM.Dialog, "Settings", "", {
                    x: "25%",
                    y: "10%",
                    width: "50%",
                    height: "80%",
                    shadow: true,
                    dialogOptions: JSWM.DialogOptions.ok
                                 | JSWM.DialogOptions.cancel,
                    onAccept: function (win) {
                        settingGroups.forEach(function (e) {
                            if (e instanceof SettingsGroup)
                                e.update(win);
                        });
                    }
                });

            var ui = new SettingsGroup("UI");
                ui.getConfig = function (cb) { return cb(uiConfig); };
                ui.setConfig = function (sg, changes, callback) {
                    if (Object.keys(changes).length) {
                        for (var prop in changes) if (changes.hasOwnProperty(prop))
                            uiConfig[prop] = changes[prop];

                        saveUIConfig();
                        callback();
                    }
                };
                ui.humanise = function (name) {
                    var labels = {
                        useMJPEG: "Use MJPEG",
                        jpegRefreshDelay: "Refresh Delay",
                        mjpegRefreshDelay: "Stream Refresh Delay",
                        motorMaxSpeed: "Maximum Motor Speed",
                        motorTurnMagnitude: "Motor Turn Magnitude"
                    };
                    return labels[name] || name;
                };
                ui.rangeOptions = {
                    motorMaxSpeed: [0, 1],
                    motorTurnMagnitude: [0, 2]
                };
                ui.generate(window);
            settingGroups.push(ui);

            var camera = new SettingsGroup("Camera");
                camera.getConfig = getCameraConfig;
                camera.setConfig = function (sg, changes, callback) {
                    if (Object.keys(changes).length) {
                        $.ajax({
                            method: "PUT",
                            url: "/api/v1/camera/config",
                            data: JSON.stringify(changes),
                            contentType: "application/json",
                            success: function (response, status, xhr) {
                                refreshCamera();
                                callback();
                            },
                            error: function (xhr, status, error) {
                                reportError("Failed to save camera configuration.", xhr);
                            }
                        });
                    }
                };
                camera.limitedOptions = LimitedOptions;
                camera.humanise = getHumanReadableOption;
                camera.generate(window);
            settingGroups.push(camera);
        });

        function getMotorParameters(newDirection) {
            function lookup(dir) {
                return $(".move-robot-control."+dir).hasClass("active")
                    || dir == newDirection;
            }

            var speed = 0, direction = 0;
            if (lookup("forwards")) speed += uiConfig["motorMaxSpeed"] || 1;
            if (lookup("backwards")) speed -= uiConfig["motorMaxSpeed"] || 1;
            if (lookup("right")) direction += uiConfig["motorTurnMagnitude"] || 1;
            if (lookup("left")) direction -= uiConfig["motorTurnMagnitude"] || 1;
            if (lookup("stop")) speed = direction = 0;

            if (direction !== 0 && speed == 0)
                speed = uiConfig["motorMaxSpeed"] || 1;

            return { speed: speed, direction: direction };
        }

        var buttons = ["forwards", "backwards", "left", "right", "stop"];
        buttons.forEach(function (direction) {
            function down(event) {
                if (event.button > 0)
                    return;

                var params = getMotorParameters(direction);
                console.log("New motor params: %s %s",
                    params.speed, params.direction);

                makeMotorRequest(params.speed, params.direction, function () {
                    console.log("Motor params change success");
                });
            }

            function up() {
                var params = getMotorParameters();
                console.log("New motor params: %s %s",
                    params.speed, params.direction);

                makeMotorRequest(params.speed, params.direction, function () {
                    console.log("Motor params change success");
                });
            }

            $(".move-robot-control." + direction)
                .on("keydown", down)
                .on("mousedown", down)
                .on("keyup", up)
                .on("mouseup", up);

        });

        updateCameraFeed();
    });
});
});
