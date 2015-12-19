/**
 * Created by thomas on 2015-10-25 at 21:04.
 *
 * MIT Licensed
 */
var error = require("./error"),
    express = require("express"),
    path = require("path"),
    execFile = require("child_process").execFile,
    spawn = require("child_process").spawn,
    fs = require("fs");
    
module.exports = function (auth) {

    var router = express.Router(),
        BASE_URL = "/srv/http/motor",
        motor_proc,
        motor_log = fs.createWriteStream(j("motor.log"));

    function j(filename) { return path.join(BASE_URL, filename); }

    function spawnWorker() {
        motor_proc = spawn("/usr/bin/python2",
            [j("python/worker.py")], {
                cwd: j("python"),
                stdio: [
                    "pipe",
                    motor_log,
                    motor_log
                ]
            });
        motor_proc.on("close", function (code, sig) {
            console.log("Motor worker closed: " + code);
            motor_proc = undefined;
        }).on("error", function (err) {
            console.error("Motor worker error: " + err);
        });
    }

    router.post("/control", function (req, res, next) {
        if (!req.is("application/json"))
            return next(error("invalid_request",
                "Request is required to be in application/json format."));

        if (!motor_proc)
            spawnWorker();

        try {
            motor_proc.stdin.write(JSON.stringify(req.body) + "\n", function (err) {
                if (err) return next(error("server_error",
                    "Failed to update motor configuration.", err));

                res.status(200).json({
                    "state": "success"
                });
            });
        } catch (err) {
            console.error(err);
            return next(error("server_error",
                "Failed to update motor configuration.", err));
        }

    });

    //router.get("/config", function (req, res, next) {
    //    fs.readFile(j("config.json"), function (err, data) {
    //        res.status(200).json(JSON.parse(data.toString("ascii")));
    //    });
    //});

    router.post("/stop", function (req, res, next) {
        if (!motor_proc)
            spawnWorker();

        motor_proc.stdin.write("{speed:0,direction:0}\n", function (err) {
            if (err) return next(error("server_error",
                "Failed to update motor configuration.", err));
        })
    });
    
    return router;

};
