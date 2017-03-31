const winston = require('winston');
const expressWinston = require('express-winston');

const transports = [
	new winston.transports.Console({
		json: true,
		colorize: true,
		showLevel: false
	})
];

const logger = expressWinston.logger({
	transports,
	colorStatus: true,
	colorize: true
});

module.exports.logger = logger;


const errorLogger = expressWinston.errorLogger({
	transports
});

module.exports.errorLogger = errorLogger;