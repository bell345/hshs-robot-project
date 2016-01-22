/**
 * Created by thomas on 2016-01-22 at 17:20.
 *
 * MIT Licensed
 */
var error = require("./error");
var VERSION = 1;

module.exports = function (next) {
    return function (text) {
        console.log("Recv msg: %s", text);
        var msg = {};
        try {
            msg = JSON.parse(text);
        } catch (e) {
            return next(error("bad_request",
                "Message must be valid JSON."));
        }

        if (msg.version === undefined)
            return next(error("bad_request",
                "Message must have a version field.", msg));

        if (msg.version < VERSION)
            return next(error("bad_request",
                "Protocol version " + msg.version + " has been outdated. " +
                "Please use protocol version " + VERSION, msg));

        if (msg.type === undefined)
            return next(error("bad_request",
                "Message must have a type field.", msg));

        return next(null, msg);
    };
};