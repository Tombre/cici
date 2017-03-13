const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');
const _ = require('lodash');

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

const roleTypes = ['user', 'admin', 'master'];

module.exports.roleTypes = roleTypes;

/*----------------------------------------------------------
Schema
----------------------------------------------------------*/

const userShema = mongoose.Schema({
	givenName: {
		type: String,
		required: true
	},
	lastName: String,
	role: {
		type: String,
		required: true,
		enum: roleTypes
	},
	email: {
		type: String,
		required: true,
		unique: true, 
		validate: {
			validator: v => isEmail(v),
			message: '{VALUE} is not a valid email address'
		}
	},
	adapterProfiles: [{
		adapter: String,
		adapterUserID: String
	}]
}, { strict: 'throw' });

/*----------------------------------------------------------
Virtuals
----------------------------------------------------------*/

/*
*	Fullname
*	Fill out the fullname into the givenand last name, if one is provided
*/

userShema.virtual('fullname')
	.get(function() {
		 return ( this.lastName ? this.givenName + ' ' + this.lastName : this.givenName);
	})
	.set(function(fullname) {
		let [givenName, lastName] = splitName(fullname);
		this.givenName = givenName;
		if (lastName) {
			this.lastName = lastName;	
		} else {
			delete this.lastName;
		}
	})


/*----------------------------------------------------------
Model
----------------------------------------------------------*/

const User = mongoose.model('User', userShema);
module.exports.User = User;

/*----------------------------------------------------------
Functions
----------------------------------------------------------*/

/*
* Get user from their name
* Attempts to find every user that matches the full name
*/

function getUsersFromName(fullname) {
	let givenName = fullname.split(' ')[0];
	let lastName = fullname.split(' ')[1];
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
				$elemMatch: { adapter: adapterID, adapterUserID: author } 
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
	return User.findOne({ email })
		.catch(e => console.log(e));
}

module.exports.getUserFromEmail = getUserFromEmail;


/*
* Split name
* Splits a fullname into given names
*/
function splitName(fullName) {
	let givenName = fullName.split(' ')[0];
	let lastName = fullName.split(' ')[1];
	return [givenName, lastName]
}

module.exports.splitName = splitName;


/*
*	Has Permission
*	Tests if the user has permission to edit a particular attribute
*/
function hasPermission(role, needed) {
	if (roleTypes.indexOf(role) < roleTypes.indexOf(needed)) {
		return false;
	}
	return true;
}

module.exports.hasPermission = hasPermission;


/*
* 	Get adapter profile	
*	Takes a response and gets an adapter profile from it
*/
function getAdapterProfile(response) {
	return {
		adapter: response.adapterID,
		adapterUserID: response.author
	}
}

module.exports.getAdapterProfile = getAdapterProfile;
