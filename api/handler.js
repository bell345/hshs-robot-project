/**
 * Created by thomas on 2015-10-26 at 20:10.
 *
 * MIT Licensed
 */
var error = require("./error");

module.exports = function () {
    return function (err, req, res, next) {
        if (!(err instanceof error)) return next(err);

        delete err.name;
        delete err.message;

        //console.log(err.stack || err);
        delete err.stack;

        if (err.headers) res.set(err.headers);
        delete err.headers;

        res.status(err.status).send(err);
    }
};