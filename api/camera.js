/**
 * Created by thomas on 2015-10-25 at 21:03.
 *
 * MIT Licensed
 */
var error = require("./error"),
    express = require("express"),
    mjpeg = require("../serve/mjpeg"),
    execFile = require("child_process").execFile,
    fs = require("fs"),
    local = require("../serve/static");

var router = express.Router(),
    BASE_URL = "/srv/http/camera/";

router.use("/mjpeg", mjpeg("/dev/shm/mjpeg/cam.jpg"));
router.use("/jpeg", local("/dev/shm/mjpeg/cam.jpg"));

router.post("/restart", function (req, res, next) {
    execFile(BASE_URL+"restart.sh", function (err) {
        if (err) return next(error("server_error", "Camera failed to restart."));

        var sent = false;

        function readStatusFile(callback) {
            fs.readFile(BASE_URL + "status.txt", function (err, data) {
                if (err) return next(error("server_error",
                    "Camera failed to restart."));

                if (data.toString("ascii") === "ready" && !sent) {
                    callback();
                    res.status(200).json({
                        "state": "success"
                    });
                    sent = true;
                } else console.log(data);
            });
        }

        function watchStatusFile() {
            readStatusFile(function () {});
            var watcher = fs.watch(BASE_URL + "status.txt",
                { persistent: false }, function (event) {
                    if (event === "change") {
                        readStatusFile(function () {
                            watcher.close();
                        });
                    }
                });

            setTimeout(function () {
                if (sent) return;

                watcher.close();

                console.log("Timeout!!!");
                res.status(500).json({
                    "error_type": "server_error",
                    "error_description":
                        "The camera failed to restart within the timeout period.",
                    "status": 500,
                    "state": "timeout"
                });
            }, 20000);
        }

        watchStatusFile();
    });
});

var disallowedOptions = [
    /^motion/,
    /^vector/,
    /path$/,
    /file$/,
    "end_box",
    "end_img",
    "end_vid",
    "error_hard",
    "error_soft",
    "start_vid"
];
function isOptionAllowed(option) {
    if (option === undefined) return false;

    var allowed = true;
    disallowedOptions.forEach(function (e) {
        if (
            e instanceof RegExp &&
            option.match(e) !== null
        ) allowed = false;
        else if (
            typeof(e) === typeof("") &&
            e === option
        ) allowed = false;
    });
    return allowed;
}
function sanitise(str) {
    var newstr = "";
    for (var i=0;i<str.length;i++) {
        if (
            str.charCodeAt(i) >= 0x20 &&
            str.charCodeAt(i) < 0x7f
        ) newstr += str[i];
    }
    return newstr;
}
function readConfigFile(filename, config, next, callback) {
    fs.readFile(filename, function (err, data) {
        if (err) return next(error("server_error", "Failed to get camera config: "+filename));

        var lines = data.toString("ascii").split("\n");
        for (var i=0;i<lines.length;i++) {
            var line = lines[i].trim();

            if (!line.length) continue;
            if (line[0] == "#") continue;

            var key = "", value = "", parsedKey = false;
            for (var j=0;j<line.length;j++) {
                if (line[j] == " " && !parsedKey) parsedKey = true;
                else if (!parsedKey) key += line[j];
                else value += line[j];
            }

            if (isOptionAllowed(key))
                config[key] = value;
        }

        callback(config);
    })
}
function writeToConfigFile(filename, config, next, callback) {
    var contents = "";
    for (var key in config) if (config.hasOwnProperty(key))
        contents += key + " " + config[key].toString() + "\n";

    fs.writeFile(filename, contents, function (err) {
        if (err) return next(error("server_error", "Failed to save config file."));

        callback();
    });
}
function getCameraConfig(next, callback) {
    readConfigFile("/etc/raspimjpeg", {}, next, function (config) {
        readConfigFile(config["user_config"] || BASE_URL+"user.cfg",
            config, next, function (config) {
                callback(config);
            });
    });
}

router.get("/config", function (req, res, next) {
    getCameraConfig(next, function (config) {
        delete config["user_config"];
        res.status(200).json(config);
    });
});

router.put("/config", function (req, res, next) {
    if (!req.is("application/json"))
        return next(error("invalid_request",
            "Request is required to be in application/json format."));

    readConfigFile("/etc/raspimjpeg", {}, next, function (config) {
        if (!config["user_config"]) return next(error("server_error",
            "User config file cannot be found."));

        var configFile = config["user_config"];

        readConfigFile(configFile, {}, next, function (config) {

            for (var key in req.body) if (req.body.hasOwnProperty(key)) {
                console.log(key);
                var value = sanitise(req.body[key]);
                key = sanitise(key);
                if (isOptionAllowed(key) && key !== "user_config")
                    config[key] = value;
            }

            writeToConfigFile(configFile, config, next, function () {
                getCameraConfig(next, function (config) {
                    delete config["user_config"];
                    res.status(200).json(config);
                });
            });

        });
    })
});

module.exports = router;