/**
 * Created by thomas on 2015-12-17 at 23:59.
 *
 * MIT Licensed
 */
var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

module.exports = {
    AccessToken: mongoose.model("AccessToken", new Schema({
        token: String,
        id: Number,
        expires: Date
    })),
    User: mongoose.model("User", new Schema({
        id: { type: Number, index: true },
        username: String,
        hash: String
    }))
};