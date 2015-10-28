/**
 * Created by thomas on 2015-10-25 at 13:12.
 *
 * MIT Licensed
 */
var express = require('express');

module.exports = function (auth) {
    var router = express.Router();

    router.get("/", function (req, res, next) {
        res.render("login", {title: "Login"});
    });

    router.post("/", auth.issueToken());

    return router;
};
