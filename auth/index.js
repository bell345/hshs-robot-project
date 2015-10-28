/**
 * Created by thomas on 9/26/15.
 *
 * Almost entirely based off of oauth2-server, licensed under the Apache License:
 *
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

var issue = require("./issue"),
    error = require("./error"),
    authenticate = require("./auth"),
    qs = require("qs");

module.exports = AuthServer;

function AuthServer(config) {
    config = config || {};

    if (!config.model)
        throw new Error("Auth needs a model to function");

    this.model = config.model;

    this.accessTokenLifetime = config.accessTokenLifetime !== undefined ?
        config.accessTokenLifetime :
        3600;

    this.loginNotificationRedirect = config.loginNotificationRedirect;

    this.challengeRedirect = config.challengeRedirect;

    this.redirectDelay = config.redirectDelay !== undefined ?
        config.redirectDelay :
        this.loginNotificationRedirect !== undefined ?
            5000 : 0;

    this.debug = config.debug ? function (m) { console.log(m); } : function () {};

    this.rawErrorHandling = config.rawErrorHandling !== undefined ?
        config.rawErrorHandling :
        false;
}


AuthServer.prototype.issueToken = function () {
    var self = this;
    return function (req, res, next) {
        return new issue(self, req, res, next);
    };
};

AuthServer.prototype.authenticate = function () {
    var self = this;
    return function (req, res, next) {
        return new authenticate(self, req, res, next);
    };
};

AuthServer.prototype.errorHandler = function () {
    var self = this;
    return function (err, req, res, next) {
        if (!(err instanceof error)) return next(err);

        delete err.name;
        delete err.message;

        self.debug(err.stack || err);
        delete err.stack;

        if (err.headers) res.set(err.headers);
        delete err.headers;

        if (req.method === "GET" && (
                !(self.rawErrorHandling instanceof RegExp) ||
                    req.path.match(self.rawErrorHandling) === null
            )) {
            if (self.challengeRedirect && err.status >= 400 && err.status < 500)
                return res.redirect(
                    self.challengeRedirect + "?" +
                    qs.stringify({
                        "error": err.error_type,
                        "redirect": req.path
                    }));
            else
                return res.status(err.status).render("error", {
                    message: err.message,
                    error: {}
                });

        }

        res.status(err.status).send(err);
    };
};