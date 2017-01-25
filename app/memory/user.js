const mongoose = require('mongoose');

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

const profileTypes = {
	"facebook": {},
	"twitter": {},
	"slack": {
		"event_user_key": "user"
	}
};

module.exports.profileTypes = profileTypes;

/*----------------------------------------------------------
Schema
----------------------------------------------------------*/

const userShema = mongoose.Schema({
	givenName: String,
	lastName: String,
	profiles: [{
		type: String,
		username: String,
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
* Get user from name in response
* Attempts to find the user that is mentioned in a response by the users name perameters
*/
function getUserFromNameInResponse(response) {
	let { givenName, lastName, fullname } = response.meaning.parameters;
	if (fullname) {
		givenName = fullname.split(' ')[0];
		lastName = fullname.split(' ')[1];
	}
	return User.findOne({ givenName, lastName })
		.catch(e => console.log(e))
}

module.exports.getUserFromNameInResponse = getUserFromNameInResponse;


/*
* Get user from adapter event
* Attempts to find the user that is mentioned in a response by the event passed by the adapter
*/
function getUserFromAdapterEvent(response) {
	
	let { adapterID, adapterEvent } = response;
	
	if (profileTypes[adapterID] && profileTypes[adapterID].event_user_key) {
		let userProfileID = [profileTypes[adapterID].event_user_key]
	}
	
	return User.findOne({
			'profiles' : { 
				$elemMatch: { type: adapterID, id: userProfileID } 
			}
		})
		.catch(e => console.log(e))
}

module.exports.getUserFromAdapterEvent = getUserFromAdapterEvent;


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