/**
 * Created by thomas on 2016-01-22 at 17:22.
 *
 * MIT Licensed
 */
var error = require("./error"),
    send = require("./send"),
    parse = require("./parse");

module.exports = function (auth, privileged) {
    return function (ws, req, next) {
        console.log("Reached middleware");
        var handler = parse(function (err, msg) {
            if (err) return next(err);

            if (msg.type == "auth") {
                if (!msg.token)
                    return next(error("bad_request",
                        "Messages of type 'auth' require the token field.",
                        msg));

                auth.verify(msg.token, function (err, token) {
                    if (err) return next(err);

                    req.user = token.user || { id: token.id };

                    auth.model.getUser(req.user.id, function (err, user) {
                        if (err) return next(error("server_error", false, msg, err));

                        delete user.hash;
                        ws.user = req.user = user;

                        if (privileged && req.user.id == 2)
                            return next(error("invalid_token",
                                "A privileged account is required to access this resource.",
                                msg));

                        send(ws, {
                            type: "auth",
                            authenticated: true
                        }, msg);
                        ws.authenticated = req.authenticated = true;
                        ws.removeListener("message", handler);

                        next();
                    });
                });
            } else return next(error("forbidden",
                "To access the WebSocket API, authentication is required. " +
                "Please send a message with an 'auth' type.", msg));
        });
        ws.on("message", handler);
    };
};