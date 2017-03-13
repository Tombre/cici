const mongoose = require('mongoose');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const password = require('password');
const { sendMail } = require('helpers/nodemailer');
const removeTabs = require('remove-tabs');

/*----------------------------------------------------------
Config
----------------------------------------------------------*/

const SALT_WORK_FACTOR = 10;

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function chainMiddleWare() {
	let fns = [...arguments];
	return function(next) {
		fns.forEach(fn => fn.apply(this, [...arguments]));
	}
}

/*----------------------------------------------------------
Schema
----------------------------------------------------------*/

const accessTokenSchema = mongoose.Schema({
	createdAt: { 
		type: Date, 
		expires: 600,
		default: Date.now
	},
	userID: {
		type: String,
		required: true
	},
	adapterID: {
		type: String,
		required: true
	},
	passphrase: {
		type: String
	}
}, { strict: 'throw' });

/*----------------------------------------------------------
MiddleWare
----------------------------------------------------------*/

/*
*	Encrypt the passphrase
*	Encrypts a passphrase to the db. Uses a salt set in the config above
*/

function encryptPassphrase(next) {
	
	let accessToken = this;
	if (!accessToken.passphrase || !accessToken.isModified('passphrase')) return next();

	bcrypt.genSalt(SALT_WORK_FACTOR)
		.then(salt => bcrypt.hash(this.passphrase, salt))
		.then(hash => {
			accessToken.passphrase = hash;
			next();
		})
		.catch(err => next(err));
}

/*----------------------------------------------------------*/

accessTokenSchema.pre('save', chainMiddleWare(
	encryptPassphrase
));


/*----------------------------------------------------------
Model
----------------------------------------------------------*/

const AccessToken = mongoose.model('AccessToken', accessTokenSchema);
module.exports.AccessToken = AccessToken;

/*----------------------------------------------------------
Functions
----------------------------------------------------------*/

/*
*	Authenticate
*	Authenticates a passphrase to a token
*/
function authenticate(token, passphrase) {
	return bcrypt.compare(passphrase, token.passphrase)
		.then(isMatch => {
			if (isMatch === true) return true;
			return false
		})
}

module.exports.authenticate = authenticate;


/*
*	Make access token
*	Makes a token for the user to say back to the bot, this will authenticated them to an adapter. The token will expire after 10 minutes
*/
function makeAccessToken(user, adapterID) {

	let passphrase = password(5);
	let token = new AccessToken({ userID: user._id, adapterID, passphrase })
	return token.save()
		.then(token => sendMail(
			user.email, 
			'Your access token', 
			removeTabs(`
				Hi ${user.fullname},

				You recently requested an access token to conenct your Cici accout to a new channel (${adapterID}). Your access token is below:
				${passphrase}

				To use the access token, just copy and paste it into the conversation we're already having about getting you authented. You may need to ask to be authenticated again if that conversation has ended.

				if you didn't ask for an access token, then you can ignore this email.

				Thanks,
				Cici
			`)
		))
		.then(info => token)

}

module.exports.makeAccessToken = makeAccessToken;