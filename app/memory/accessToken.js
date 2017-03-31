const mongoose = require('mongoose');
const _ = require('lodash');
const crypto = require('crypto');
const { sendMail } = require('helpers/nodemailer');
const removeTabs = require('remove-tabs');

/*----------------------------------------------------------
Config
----------------------------------------------------------*/

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
	tokenType: {
		type: String,
		enum: ['adapter', 'service'],
		required: true	
	},
	tokenTargetID: {
		type: String,
		required: true
	},
	token: {
		type: String
	},
	options: {
		type: Object
	}
}, { strict: 'throw' });

/*----------------------------------------------------------
MiddleWare
----------------------------------------------------------*/

/*
*	Generate Token
*	Generates a random token if one is not already added
*/

function generateToken(next) {

	let accessToken = this;
	if (accessToken.token && !accessToken.isModified('token')) return next();

	const buf = crypto.randomBytes(20, (err, buf) => {
		if (err) return next(err);
		accessToken.token = buf.toString('hex');
		next();
	});

}

/*----------------------------------------------------------*/

accessTokenSchema.pre('save', chainMiddleWare(
	generateToken
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
*	Makes an adapter access token
*	Makes a token which will be sent to the users email address. When clicked, this will authenticated them to an adapter. The token will expire after 10 minutes.
*/

function makeAdapterAccessToken(user, adapterID, adapterUserID) {

	let accessToken = new AccessToken({ 
		userID: user._id, 
		tokenType: 'adapter', 
		tokenTargetID: adapterID,
		options: { adapterUserID }
	});

	return accessToken.save()
		.then(accessToken => {
			return sendMail(
				user.email, 
				'Your access token', 
				removeTabs`
					Hi ${user.fullname},

					You recently requested an access token to conenct your Cici accout to a new channel (${adapterID}). Your access token is below:
					<a href="http://localhost:3000/auth/${accessToken.token}">http://localhost:3000/auth/${accessToken.token}</a>

					To use the access token, just copy and paste it into the conversation we're already having about getting you authented. You may need to ask to be authenticated again if that conversation has ended.

					if you didn't ask for an access token, then you can ignore this email.

					Thanks,
					Cici
				`)
			}
		)
		.then(info => accessToken)

}

module.exports.makeAdapterAccessToken = makeAdapterAccessToken;


/*
*	Make service access token
*	Generates an access token that you can use to connect an oauth service
*/

function makeServiceAccessToken(user, service, scope) {

	let accessToken = new AccessToken({ 
		userID: user._id, 
		tokenType: 'service', 
		tokenTargetID: service,
		options: { scope }
	});

	return accessToken.save()

}

module.exports.makeServiceAccessToken = makeServiceAccessToken;