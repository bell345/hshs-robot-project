/**
 * Created by thomas on 9/27/15.
 */

var error = require("./error"),
    runner = require("./runner");

module.exports = Auth;

var fns = [
    getToken,
    checkToken
];

function Auth(config, req, res, next) {
    this.config = config;
    this.model = config.model;
    this.req = req;
    this.res = res;

    runner(fns, this, next);
}

function retrieveBearerToken(header) {
    if (!header) return null;
    var match = header.match(/^Bearer (.*)$/);
    if (!match) return null;
    else return match[1];
}

function getToken(done) {
    var cookieToken = this.req.cookies.access_token,
        headerToken = retrieveBearerToken(this.req.get("Authorization"));

    if (!cookieToken &&
        !headerToken)
        return done(error("invalid_token",
            "Access token is missing or expired. Please log in."));

    this.bearerToken = cookieToken || headerToken;
    done();
}

function checkToken(done) {
    var self = this;
    this.model.getAccessToken(this.bearerToken, function (err, token) {
        if (err) return done(error("server_error", false, err));

        if (!token)
            return done(error("invalid_token",
                "The access token provided is invalid."));

        if (token.expires !== null &&
            (!token.expires || token.expires < new Date()))
            return done(error("invalid_token",
                "The access token provided has expired."));

        self.req.user = token.user ? token.user : { id: token.id };

        if (self.req.privileged && self.req.user.id == 2)
            return done(error("invalid_token",
                "A privileged account is required to access this resource."));

        done();
    });
}
