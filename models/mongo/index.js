/**
 * Created by thomas on 2015-12-17 at 23:59.
 *
 * MIT Licensed
 */
var mongoose = require("mongoose"),
    schema = require("./schema"),
    AccessToken = schema.AccessToken,
    User = schema.User,
    bcrypt = require("bcryptjs"),
    model = module.exports,
    connectionString = "mongodb://net-user:7NAbjDUSIyr7UKMRhQL1@localhost:27017/auth";

mongoose.connect(connectionString);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "DB connection error: "));
db.once("open", function () {
    console.log("Connected to DB");
});

model.getAccessToken = function (accessToken, callback) {
    AccessToken.findOne({ token: accessToken }, callback);
};

model.saveAccessToken = function (accessToken, expires, user, callback) {
    var token = new AccessToken({
        token: accessToken,
        id: user.id,
        expires: expires
    });

    token.save(callback);
};

model.getUser = function (id, callback) {
    User.findOne({ id: id }, callback);
};

model.login = function (username, password, callback) {
    User.findOne({ username: username }, function (err, result) {
        if (err || !result) return callback(err);

        var id = result.id;
        bcrypt.compare(password, result.hash, function (err, res) {
            if (err || !res) return callback(err || "User credentials are invalid.");

            callback(err, { id: id, username: username });
        });
    });
};

model.register = function (username, password, callback) {
    User.count({ username: username }, function (err, count) {
        if (err || count !== 0) return callback(err || "User exists");

        User.find({}, function (err, users) {
            if (err) return callback(err);

            var id = Math.max.apply(this, users.map(function (e) { return e.id; })) + 1;

            bcrypt.hash(password, 8, function (err, hash) {
                if (err || !hash) return callback(err);

                var user = new User({
                    id: id,
                    username: username,
                    hash: hash
                });
                user.save(callback);
            });
        });
    });
};