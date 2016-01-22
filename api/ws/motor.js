/**
 * Created by thomas on 2016-01-22 at 21:10.
 *
 * MIT Licensed
 */
var fs = require("fs"),
    error = require("./error"),
    send = require("./send"),
    execFile = require("child_process").execFile,
    spawn = require("child_process").spawn,
    path = require("path");

function control(ws, req, msg, next) {

}

module.exports = function (auth, server) {
    var BASE_URL = "/srv/http/motor",
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

    var mapping = {
        control: function (ws, req, msg, next) {
            try {
                var recv_time = new Date().getTime() - msg.time;
                var params = {};
                if (msg.speed !== undefined) params.speed = msg.speed;
                if (msg.direction !== undefined) params.direction = msg.direction;

                motor_proc.stdin.write(JSON.stringify(params) + "\n", function (err) {
                    if (err) return next(error("server_error",
                        "Failed to update motor configuration.", msg, err));

                    var exec_time = new Date().getTime() - (recv_time + msg.time);
                    send(ws, {
                        type: "status",
                        success: true,
                        time: msg.time,
                        time_events: {
                            receive: recv_time,
                            execute: exec_time
                        }
                    }, msg);
                });
            } catch (err) {
                console.error(err);
                return next(error("server_error",
                    "Failed to update motor configuration.", err));
            }

        },
        stop: function (ws, req, msg, next) {
            motor_proc.stdin.write("{speed:0,direction:0}\n", function (err) {
                if (err) return next(error("server_error",
                    "Failed to update motor configuration.", msg, err));

                send(ws, {
                    type: "status",
                    success: true
                }, msg);
            });
        }
    };

    return function (ws, req, msg, next) {
        if (!msg.command)
            return next(error("bad_request",
                "The 'motor' type requires a 'command' field.", msg));

        if (!motor_proc)
            spawnWorker();

        var handler = mapping[msg.command];
        if (!handler)
            return next(error("not_found",
                "The requested command could not be handled.", msg));

        handler(ws, req, msg, next);
    }
};