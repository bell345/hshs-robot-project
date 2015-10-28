/**
 * Created by thomas on 9/26/15.
 */

var crypto = require("crypto"),
    error = require("./error");

module.exports = Token;

function Token(callback) {
    crypto.randomBytes(256, function (ex, buffer) {
        if (ex) return callback(error("server_error"));;

        var token = crypto
            .createHash("sha1")
            .update(buffer)
            .digest("hex");

        callback(false, token);
    })
}