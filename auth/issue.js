/**
 * Created by thomas on 9/26/15.
 */

var runner = require("./runner"),
    error = require("./error"),
    token = require("./token"),
    qs = require("qs");

module.exports = Grant;

var fns = [
    authenticate,
    generateToken,
    saveToken,
    sendResponse
];

function Grant(config, req, res, next) {
    if (!(this instanceof Grant))
        return new Grant(config, req, res, next);

    this.config = config;
    this.model = config.model;
    this.req = req;
    this.res = res;
    this.now = new Date();

    runner(fns, this, next);
}

function extractBasicCredentials(header) {
    if (!header) return null;
    var creds = header.match(/^Basic ([A-Za-z\/\+=]+)^/);
    if (!creds) return null;
    else
        return new Buffer(creds[1], 'base64').toString("ascii").split(":");
}

function authenticate(done) {
    var creds = null;

    if (this.req.method != "POST")
        return done(error("invalid_request",
            "Only POST method permitted."));

    if (!this.req.is("application/x-www-form-urlencoded")) {
        creds = extractBasicCredentials(this.req.get("WWW-Authenticate"));
        if (!creds)
            return done(error("invalid_client",
                "WWW-Authenticate header was missing or malformed."));
    } else {
        if (!this.req.body.username || !this.req.body.password)
            return done(error("invalid_client",
                "Missing parameters. Both 'username' and 'password' are required."));

        creds = [this.req.body.username, this.req.body.password];
    }

    var self = this;
    return this.model.login(creds[0], creds[1], function (err, user) {
        if (err)
            return done(error("server_error", false, err));

        if (!user)
            return done(error("invalid_grant", "User credentials are invalid."));

        self.user = user;
        done();
    });
}

function generateToken(done) {
    var self = this;
    token(function (err, token) {
        self.accessToken = token;
        done(err);
    });
}

function saveToken(done) {
    var expires = null;
    if (this.config.accessTokenLifetime !== null) {
        expires = new Date(this.now);
        expires.setSeconds(expires.getSeconds() + this.config.accessTokenLifetime);
    }

    this.model.saveAccessToken(this.accessToken, expires, this.user, function (err) {
        if (err)
            return done(error("server_error", false, err));
        done();
    });
}

function sendResponse(done) {
    var lifetime;
    var response = {};
    response.access_token = this.accessToken;
    var query = {};
    if (this.config.accessTokenLifetime !== null) {
        lifetime = this.config.accessTokenLifetime;
        response.expires_in = lifetime;
    }

    this.res.set({"Cache-Control": "no-store", "Pragma": "no-cache"});

    this.res.cookie("access_token",
        this.accessToken, { maxAge: lifetime });

    var redirect = this.req.body.redirect || this.req.query.redirect || null;
    if (this.config.loginNotificationRedirect !== undefined) {
        if (redirect !== null)
            query["redirect"] = redirect;

        if (this.config.redirectDelay !== undefined)
            query["delay"] = this.config.redirectDelay;

        this.res.redirect(this.config.loginNotificationRedirect +
            "?" + qs.stringify(query));
    } else if (redirect !== null) {
        this.res.redirect(redirect);
    } else this.res.jsonp(response);

}
