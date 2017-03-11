const mongoose = require('mongoose');
const config = require('config');

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://localhost/${config.database.name}`);
const db = mongoose.connection;

/*----------------------------------------------------------
Connect
----------------------------------------------------------*/

function connect(cb) {
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', () => {
		console.log('Connected to database');
		cb();
	});
}

module.exports = connect;