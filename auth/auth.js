/**
 * Created by thomas on 9/27/15.
 */

var error = require("./error"),
    runner = require("./runner"),
    verify = require("./verify");

module.exports = Auth;

var fns = [
    getToken,
    verifyToken,
    checkToken
];

function Auth(config, req, res, next) {
    this.config = config;
    this.model = config.model;
    this.req = req;
    this.res = res;

    runner(fns, this, next);
}

function retrieveBearerToken(req) {
    if (!req.get) return null;
    var header = req.get("Authorization");
    if (!header) return null;
    var match = header.match(/^Bearer (.*)$/);
    if (!match) return null;
    else return match[1];
}

function getToken(done) {
    var cookieToken = this.req.cookies.access_token,
        headerToken = retrieveBearerToken(this.req);

    if (!cookieToken &&
        !headerToken)
        return done(error("invalid_token",
            "Access token is missing or expired. Please log in."));

    this.bearerToken = cookieToken || headerToken;
    done();
}

function verifyToken(done) {
    var self = this;
    self.config.verify(this.bearerToken, function (err, result) {
        if (err || !result) return done(err);

        self.token = result;
        done();
    });
}

function checkToken(done) {
    this.req.user = this.token.user || { id: this.token.id };

    var self = this;
    self.model.getUser(self.req.user.id, function (err, user) {
        if (err) return done(error("server_error", false, err));

        delete user.hash;
        self.req.user = user;

        if (self.req.privileged && self.req.user.id == 2)
            return done(error("invalid_token",
                "A privileged account is required to access this resource."));

        done();
    });
}
