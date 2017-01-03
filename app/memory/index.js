const mongoose = require('mongoose');
const config = require('../../config.json')["mongodb"];

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

mongoose.Promise = global.Promise;
mongoose.connect(`mongodb://localhost/${config.dbName}`);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

function whenDatabaseReady(cb) {
	db.once('open', cb);
}

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

module.exports = {
	whenDatabaseReady
}