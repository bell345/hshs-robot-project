/**
 * Created by thomas on 9/26/15.
 */
var util = require("util");

module.exports = AuthError;

function AuthError(err_spec, description, error) {
    if (!(this instanceof AuthError))
        return new AuthError(err_spec, description, error);

    Error.call(this);

    this.name = this.constructor.name;

    if (error instanceof Error) {
        this.message = error.message;
        this.stack = error.stack;
    } else {
        this.message = description;
        Error.captureStackTrace(this, this.constructor);
    }

    this.headers = {
        "Cache-Control": "no-store",
        "Pragma": "no-cache"
    };

    switch (err_spec) {
        case "invalid_client":
        case "invalid_grant":
        case "invalid_request":
            this.status = 400;
            break;
        case "invalid_token":
            this.status = 401;
            break;
        case "server_error":
            this.status = 503;
            break;
        default:
            this.status = 500;
    }

    this.error = error;
    this.error_type = err_spec;
    this.error_description = description || error;
}

util.inherits(AuthError, Error);