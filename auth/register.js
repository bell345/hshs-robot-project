/**
 * Created by Thomas on 2015-11-27.
 */

var runner = require("./runner"),
    error = require("./error");

module.exports = Register;

var fns = [
    retrieveCredentials,
    validate,
    register
];

function Register(config, req, res, next) {
    if (!(this instanceof Register))
        return new Register(config, req, res, next);

    this.config = config;
    this.model = config.model;
    this.req = req;
    this.res = res;
    this.now = new Date();

    runner(fns, this, next);
}

function retrieveCredentials(done) {
    if (this.req.method != "POST")
        return done(error("invalid_request",
            "Only POST method permitted."));

    if (!this.req.is("application/x-www-form-urlencoded"))
        return done(error("invalid_request",
            "Only application/x-www-form-urlencoded content type permitted."));

    if (!this.req.body.username || !this.req.body.password)
        return done(error("invalid_client",
            "Missing parameters. Both 'username' and 'password' are required."));

    this.credentials = [this.req.body.username, this.req.body.password];
    done();
}

function validate(done) {
    var un = this.credentials[0],
        pw = this.credentials[1];

    if (un.length > 256)
        return done(error("invalid_client",
            "Username is too long (> 256 characters)."));

    if (un.length < 2)
        return done(error("invalid_client",
            "Username must be at least 2 characters long."));

    if (pw.length > 2048)
        return done(error("invalid_client",
            "Password is too long (> 2048 characters)."));

    if (pw.length < 2)
        return done(error("invalid_client",
            "Password must be at least 2 characters long."));

    for (var i=0;i<un.length;i++) {
        var c = un.charCodeAt(i);
        if (c < 0x20)
            return done(error("invalid_client",
                "Username contains forbidden characters."));

        if (c == 0x20)
            return done(error("invalid_client",
                "Username contains spaces, which are disallowed."));

        if (c >= 0x7F)
            return done(error("invalid_client",
                "Username contains characters outside of the " +
                "ASCII range (0x00 - 0x7F). They may be supported " +
                "in the future."));
    }

    done();
}

function register(done) {
    var self = this, creds = self.credentials;
    this.model.register(creds[0], creds[1], function (err, res) {
        if (err) return done(error("server_error",
            "Registration failed", err));

        self.res.status(200).json({
            "status": "success",
            "id": res.id
        });
        done();
    });
}
