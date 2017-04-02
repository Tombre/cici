const { User, createAdapterProfile } = require('memory/user');
const { AccessToken } = require('memory/accessToken');
const passport = require('passport');
const _ = require('lodash');

const GitHubStrategy = require('services/github');
const GoogleStrategy = require('services/google');

/*----------------------------------------------------------
Types
----------------------------------------------------------*/

function getAccessTokenFromRequest(req) {
	let { token } = req.params;
	return AccessToken.findOne({ token })
}


/*
*	Resolve Adapter token
*	Resolves an adapter token, creating an adapter profile in the process
*/
function resolveAdapterToken(accessToken, req, res, next) {
	let { userID, tokenTargetID, options } = accessToken;
	return accessToken
		.remove()
		.then(() => createAdapterProfile(userID, tokenTargetID, options.adapterUserID))
		.then(user => res.send(`Thankyou ${user.fullname}`))
}


/*
*	Resolve Service token
*	Resolves a service token via passport authorize. tokenTargetID needs to match an auth strategy
*/
function initServiceTokenResolver(accessToken, req, res, next) {
	let { tokenTargetID, options, token } = accessToken;
	console.log('INIT IT BOI');
	passport.authorize(tokenTargetID, {
		scope: options.scope,
		session: false,
		callbackURL: `/auth/${token}/callback`
	})(req, res, next);
}


/*
*	New Service from token and profile
*	Creates a new service or updates an existing one from the access token and the service profile which should be
*	passed within the req.account property.
*/
function resolveServiceToken(accessToken, req, res, next) {
	
	if (!accessToken) return res.send(`Sorry, could not complete your request. The access token you have supplied has expired.`);
	
	let serviceProfile = req.account;
	serviceProfile.scope = accessToken.options.scope;

	const sendError = () => res.send(`Sorry, your access token could not be authenticated`);

	return User.findById(accessToken.userID)
		.then(user => {
			
			if (!user) return sendError();
			
			let index = _.findIndex(user.services, service => service.name === serviceProfile.name);
			
			if (index >= 0) {
				user.services[index] = serviceProfile;
			} else {
				user.services.push(serviceProfile);
			}
			
			return Promise.all([user.save(), accessToken.remove()]);

		})
		.then(user => {
			res.send('success!');
		})
		.catch(err => sendError());
}

/*----------------------------------------------------------
Auth
----------------------------------------------------------*/

module.exports = function(app, passport) {

	/*----------------------------------------------------------
	Setup
	----------------------------------------------------------*/

	passport.use(GitHubStrategy());
	passport.use(GoogleStrategy());

	/*----------------------------------------------------------
	Token Routes
	----------------------------------------------------------*/

	/*
	*	Validate and resolve an access token
	*/
	app.get('/auth/:token', function(req, res, next) {
		getAccessTokenFromRequest(req)
			.then(accessToken => {
				if (!accessToken) return res.send(`Sorry, could not complete your request. The access token you have supplied has expired.`);
				let { tokenType } = accessToken;
				if (tokenType === 'adapter') return resolveAdapterToken(accessToken, req, res, next);
				if (tokenType === 'service') return initServiceTokenResolver(accessToken, req, res, next)
				next();
			})
			.catch(e => res.send(e));
	});


	/*
	*	Validate and resolve an access token callback
	*	This should only occur for oauth requests
	*/
	app.get(
		'/auth/:token/callback', 
		function(req, res, next) {
			getAccessTokenFromRequest(req)
				.then(accessToken => initServiceTokenResolver(accessToken, req, res, next));
		},
		function(req, res, next) {
			getAccessTokenFromRequest(req)
				.then(accessToken => resolveServiceToken(accessToken, req, res, next))
		}
	);

}