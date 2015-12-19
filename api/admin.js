/**
 * Created by Thomas on 2015-11-27.
 */
var error = require("./error"),
    express = require("express"),
    path = require("path"),
    execFile = require("child_process").execFile;

module.exports = function (auth) {

    var router = express.Router(),
        BASE_URL = "/srv/http/admin";

    function j(filename) { return path.join(BASE_URL, filename); }

    router.post("/restart", function (req, res, next) {
        res.status(200).end();
        execFile(j("../restart.sh"));
    });
    
    return router;

};