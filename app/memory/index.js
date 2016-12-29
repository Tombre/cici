var mongoose = require('mongoose');
const config = require('../../config.json')["mongodb"];

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

mongoose.connect(`mongodb://localhost/${config.dbName}`);

const Users = mongoose.model('Users', { 
	givenName: String,
	lastName: String
});

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function query() {}

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = {
	Users
}

