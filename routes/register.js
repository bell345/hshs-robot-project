/**
 * Created by Thomas on 2015-11-27.
 */
var express = require('express');

module.exports = function (auth) {
    var router = express.Router();

    router.get("/", function (req, res, next) {
        res.render("register", {title: "Register"});
    });

    router.post("/", auth.register());

    return router;
};
