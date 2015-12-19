/**
 * Created by thomas on 2015-10-25 at 21:03.
 *
 * MIT Licensed
 */
var error = require("./error"),
    camera = require("./camera"),
    motor = require("./motor"),
    admin = require("./admin"),
    fs = require("fs"),
    path = require("path"),
    express = require("express");

var BASE_URL = "/srv/http";

function j(filename) { return path.join(BASE_URL, filename); }

function retrieveBearerToken(header) {
    if (!header) return null;
    var match = header.match(/^Bearer (.*)$/);
    if (!match) return null;
    else return match[1];
}

function getToken(req, cb) {
    var cookieToken = req.cookies.access_token,
        headerToken = retrieveBearerToken(req.get("Authorization"));

    if (!cookieToken &&
        !headerToken)
        return;

    return cb(cookieToken || headerToken);
}

module.exports = function (model, auth) {
    var router = express.Router();

    // API request logging
    // kills the robot
    // do not use
    //router.use(function (req, res, next) {
    //    var entry = [];
    //    entry.push(new Date().toISOString());
    //    entry.push(req.path);
    //
    //    function commit(x) {
    //        entry.push(x);
    //        fs.appendFile(j("access.log"), entry.join(" ") + "\n");
    //    }
    //    getToken(req, function (token) {
    //        model.getAccessToken(token, function (err, entry) {
    //            if (err || !entry) return commit("no_auth");
    //            model.getUser(entry.user_id, function (err, user) {
    //                if (err || !user) return commit("no_auth");
    //                commit(user.username);
    //            });
    //        });
    //    });
    //    next();
    //});

    router.use("/camera", auth.authenticate(), camera(auth));
    router.use("/motor", auth.authenticate(true), motor(auth));
    router.use("/admin", auth.authenticate(true), admin(auth));

    router.use(function (req, res, next) {
        return next(error("not_found",
            "The requested API endpoint was not found."));
    });
    
    return router;
};

module.exports.errorHandler = require("./handler");
