const express = require('express');
var   helmet = require('helmet')
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
//const basicAuth = require('express-basic-auth'); // removed auth after data anon'd

const getdata = require(path.join(__dirname, 'routes', 'getdata'));
const index   = require(path.join(__dirname, 'routes', 'index'));
const timeline= require(path.join(__dirname, 'routes', 'timeline'));
const table   = require(path.join(__dirname, 'routes', 'table'));
const cred    = require(path.join(__dirname, 'credentials'));

var app = express();

app.use(helmet());
//app.use(basicAuth(cred));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// includes
app.use('/swsdvolcal/vis', express.static(path.join(__dirname, 'node_modules', 'vis', 'dist')));
app.use('/swsdvolcal', express.static(path.join(__dirname, 'public')));

// routes
app.use('/swsdvolcal/getdata', getdata);
app.use('/swsdvolcal/getdata/:id', getdata);  // note the "{mergeParams:true}" in the router ...
app.use('/swsdvolcal/timeline', timeline);
app.use('/swsdvolcal/table', table);
app.use('/swsdvolcal', index);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
