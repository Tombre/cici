const mongoose = require('mongoose');

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

const roleTypes = ['master', 'admin', 'user'];

module.exports.roleTypes = roleTypes;

/*----------------------------------------------------------
Schema
----------------------------------------------------------*/

const userShema = mongoose.Schema({
	givenName: String,
	lastName: String,
	role: String,
	email: String,
	adapterProfiles: [{
		adapter: String,
		id: String
	}]
});

/*----------------------------------------------------------
Model
----------------------------------------------------------*/

const User = mongoose.model('User', userShema);
module.exports.User = User;

/*----------------------------------------------------------
Functions
----------------------------------------------------------*/

/*
* Get user from email in response
* Attempts to find the user by their email
*/

function getUserFromEmail(email) {
	return User.findOne({ email })
		.catch(e => console.log(e))
}


/*
* Get user from their name
* Attempts to find every user that matches the full name
*/

function getUsersFromName(fullname) {
	givenName = fullname.split(' ')[0];
	lastName = fullname.split(' ')[1];
	return User.find({ givenName, lastName })
		.catch(e => console.log(e))
}

module.exports.getUsersFromName = getUsersFromName;


/*
* Get user from adapter event
* Attempts to find the user that is mentioned in a response by the event passed by the adapter
*/

function getUserFromAdapterEvent(response) {
	let { adapterID, author } = response;
	return User.findOne({
			'adapterProfiles' : { 
				$elemMatch: { adapter: adapterID, id: author } 
			}
		})
		.catch(e => console.log(e))
}

module.exports.getUserFromAdapterEvent = getUserFromAdapterEvent;


/*
* Get user from email
* Attempts to find the user from an email
*/

function getUserFromEmail(email) {
	return User.find({ email })
		.catch(e => console.log(e));
}

module.exports.getUserFromEmail = getUserFromEmail;


/*
* Split name
* Splits a fullname into given names
*/
function splitName(fullName) {
	let givenName = fullname.split(' ')[0];
	let lastName = fullname.split(' ')[1];
	return [givenName, lastName]
}

module.exports.splitName = splitName;