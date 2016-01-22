/**
 * Created by thomas on 2016-01-22 at 17:04.
 *
 * MIT Licensed
 */

var error = require("./error"),
    auth = require("./auth"),
    parse = require("./parse"),
    send = require("./send"),
    express = require("express"),
    ws = require("express-ws");

function wscallback(func) {
    return function (ws, req, next) {
        ws.on("message", parse(function (err, msg) {
            if (err) return next(err);

            func(ws, req, msg, next);
        }));
    }
}

module.exports = function (server, prefix, authserver) {
    var router = ws(express.Router(), server).app;

    var motor = require("./motor")(authserver, server);
    router.ws(prefix, auth(authserver, true), wscallback(function (ws, req, msg, next) {
        switch (msg.type) {
            case "echo":
                send(ws, {
                    message: msg.message
                }, msg);
                break;
            case "motor":
                motor(ws, req, msg, next);
                break;
            default:
                return next(error("not_found",
                    "The requested message type was unhandled."), msg);
        }
    }));

    router.use(error.handler());

    return router;
};
