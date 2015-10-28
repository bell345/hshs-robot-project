/**
 * Created by thomas on 2015-10-25 at 21:03.
 *
 * MIT Licensed
 */
var error = require("./error"),
    express = require("express");

var router = express.Router();

router.use("/camera", require("./camera"));
router.use("/motor", require("./motor"));

router.use(function (req, res, next) {
    return next(error("not_found", "The requested API endpoint was not found."));
});

module.exports = router;