/**
 * Created by thomas on 9/27/15.
 */
var pg = require("pg"),
    bcrypt = require("bcryptjs"),
    model = module.exports,
    connectionString = "postgres://net-user:7NAbjDUSIyr7UKMRhQL1@localhost:5432/auth";

model.getAccessToken = function (accessToken, callback) {
    pg.connect(connectionString, function (err, client, done) {
        if (err) return callback(err), done();

        client.query("SELECT access_token, expires, user_id FROM access_tokens " +
            "WHERE access_token = $1", [accessToken], function (err, result) {
            if (err || !result.rowCount) return callback(err), done();

            var token = result.rows[0];
            callback(null, {
                accessToken: token.access_token,
                expires: token.expires,
                user_id: token.user_id
            });
            done();
        });
    });
};

model.saveAccessToken = function (accessToken, expires, user, callback) {
    pg.connect(connectionString, function (err, client, done) {
        if (err) return callback(err), done();

        client.query("INSERT INTO access_tokens(access_token, user_id, expires) " +
            "VALUES ($1, $2, $3)", [accessToken, user.id, expires], function (err, result) {
            callback(err);
            done();
        });
    });
};

model.getUser = function (id, callback) {
    pg.connect(connectionString, function (err, client, done) {
        if (err) return callback(err), done();

        client.query("SELECT * FROM users WHERE id = $1", [id], function (err, result) {
            if (err || !result.rowCount) return callback(err), done();

            var entry = result.rows[0];
            callback(err, entry);
        })
    });
};

model.login = function (username, password, callback) {
    pg.connect(connectionString, function (err, client, done) {
        if (err) return callback(err), done();

        client.query("SELECT id, hash FROM users WHERE username = $1", [username], function (err, result) {
            if (err || !result.rowCount) return callback(err), done();

            var id = result.rows[0].id;
            bcrypt.compare(password, result.rows[0].hash, function (err, res) {
                if (err || !res) return callback(err), done();

                callback(err, { id: id, username: username });
                done();
            })
        })
    });
};

model.register = function (username, password, callback) {
    pg.connect(connectionString, function (err, client, done) {
        if (err) return callback(err);

        client.query("SELECT id FROM users WHERE username = $1", [username], function (err, result) {
            if (err) return callback(err), done();

            if (result.rowCount !== 0) return callback('User exists'), done();

            client.query("SELECT id FROM users", [], function (err, fullres) {
                if (err) return callback(err), done();

                var new_id = Math.max.apply(this, fullres.rows.map(function (e, i) { return e.id; })) + 1;

                bcrypt.hash(password, 8, function (err, hash) {
                    if (err || !hash) return callback(err), done();

                    client.query("INSERT INTO users VALUES ($1, $2, $3)", [new_id, username, hash], function (err) {
                        if (err) return callback(err), done();

                        callback(err, { id: new_id });
                        done();
                    });
                });
            });
        });
    });
};
