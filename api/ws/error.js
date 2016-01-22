/**
 * Created by thomas on 2016-01-22 at 17:05.
 *
 * MIT Licensed
 */
var util = require("util"),
    send = require("./send");

function WSAPIError(spec, description, msg, error) {
    if (!(this instanceof WSAPIError))
        return new WSAPIError(spec, description, error);

    Error.call(this);

    this.name = this.constructor.name;

    if (error instanceof Error) {
        this.message = error.message;
        this.stack = error.stack;
    } else {
        this.message = description;
        Error.captureStackTrace(this, this.constructor);
    }

    this.error = error;
    this.error_type = spec;
    this.error_description = description || error;
    this.message = msg;
}
util.inherits(WSAPIError, Error);

module.exports = WSAPIError;

module.exports.handler = function () {
    return function (err, req, res, next) {
        send(req.ws, {
            type: "error",
            error_type: err.error_type,
            error_description: err.error_description
        }, err.message);
    }
};