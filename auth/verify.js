/**
 * Created by thomas on 2016-01-22 at 16:42.
 *
 * MIT Licensed
 */

var error = require("./error");

module.exports = function (config, bearer, done) {
    config.model.getAccessToken(bearer, function (err, token) {
        if (err) return done(error("server_error", false, err));

        if (!token)
            return done(error("invalid_token",
                "The access token provided is invalid."));

        if (token.expires !== null &&
            (!token.expires || token.expires < new Date()))
            return done(error("invalid_token",
                "The access token provided has expired."));

        return done(null, token);
    });
};