const express = require('express');
const session = require('express-session');
const { logger, errorLogger } = require('./logger');
const auth = require('./auth');
const passport = require('passport');
const bodyParser = require('body-parser');

/*----------------------------------------------------------
CONFIG
----------------------------------------------------------*/

const port = 3000;
const app = express();

app.use(logger);
app.use(passport.initialize());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/*----------------------------------------------------------
AUTH
----------------------------------------------------------*/

auth(app, passport);

/*----------------------------------------------------------
ERROR LOGGING
----------------------------------------------------------*/

app.use(errorLogger);

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = function() {
	app.listen(port);
	console.log(`Webserver listening on port: ${port}`);
}