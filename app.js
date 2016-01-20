var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var authServer = require("./auth");
var os = require("os");
var api = require("./api");
var model = require("./models/mongo");

var routes = require('./routes/index');
var login = require("./routes/login");
var register = require("./routes/register");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var auth = new authServer({
    model: model,
    challengeRedirect: "/login",
    accessTokenLifetime: 9e6,
    rawErrorHandling: /^\/api\//
});

app.use('/', routes);
app.use('/login', login(auth));

var hostname = os.hostname(),
    os_type = os.type();

app.get("/", auth.authenticate(), function (req, res, next) {
    res.render("index", {
        title: "HSHS Robot Project",
        brand: "HSHS Robot Project",
        username: req.user.username
    });

});

//app.use("/api/v1/camera/mjpeg", auth.authenticate(), require("./serve/mjpeg")("/dev/shm/mjpeg/cam.jpg"));

app.use("/api/v1", api(model, auth));
app.use("/register", auth.authenticate(true), register(auth));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(api.errorHandler());
app.use(auth.errorHandler());

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
