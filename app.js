const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const hbs = require('hbs');
const handlebarsHelpers = require('handlebars-helpers')();
const pgp = require('pg-promise')();
const config = require('./config/config');
const userRouter = require('./routes/user');

const app = express();

// Connect to PostgreSQL
const db = pgp({
  user: 'shoppingmart',
  host: '127.0.0.1',
  database: 'foodmart',
  password: '12345',
  port: 5432,
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.__express);
hbs.registerHelper(handlebarsHelpers);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

// Use pg-promise for database access
app.use((req, res, next) => {
  req.db = db;
  next();
});


app.use('/', userRouter);


app.use((req, res, next) => {
  next(createError(404));
});

hbs.registerHelper('inc', function (value, options) {
  return parseInt(value) + 1;
});

// error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
