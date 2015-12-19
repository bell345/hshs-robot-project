/**
 * Created by thomas on 2015-10-25 at 15:44.
 *
 * MIT Licensed
 */
var express = require("express"),
    fs = require("fs");

var BOUNDARY = "MJPEG_SEPARATOR";

module.exports = function (localFile) {
    var router = express.Router();

    router.get("/", function (req, res, next) {
        var delay = 200,
            startTime = new Date().getTime(),
            timeout = 0;
        if (req.query.delay) delay = parseInt(req.query.delay);
        if (req.query.timeout) timeout = parseInt(req.query.timeout);

        res.writeHead(200, {
            "Content-Type": "multipart/x-mixed-replace; boundary=" + BOUNDARY,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Connection": "close"
        });

        res.setTimeout(timeout);

        (function serveFrame() {
            fs.readFile(localFile, function (err, data) {
                if (err) return res.status(500).end();

                res.write("--" + BOUNDARY + "\r\n");
                res.write("Content-Type: image/jpeg\r\n");
                res.write("Content-Length: " + data.length.toString() + "\r\n");

                res.write("\r\n");
                res.write(data);
                res.write("\r\n");

                if (timeout == 0 || startTime + timeout > new Date().getTime())
                    setTimeout(serveFrame, delay);
                else res.end();
            });
        })();
    });

    return router;
};