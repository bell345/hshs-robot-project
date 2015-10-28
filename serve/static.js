/**
 * Created by thomas on 2015-10-25 at 18:16.
 *
 * MIT Licensed
 */
var express = require("express");

module.exports = function (filename) {
    var router = express.Router();

    router.get("/", function (req, res, next) {
        res.sendFile(filename);
    });

    return router;
};