const express = require('express');
const _ = require('lodash');
const githubConfig = require('config').services.github;
const session = require('express-session');
const { logger, errorLogger } = require('./logger');
const routes = require('./routes');
const passport = require('passport');
const bodyParser = require('body-parser');
const GitHubStrategy = require('passport-github').Strategy;
const { User, createAdapterProfile } = require('memory/user');
const { AccessToken } = require('memory/accessToken');

/*----------------------------------------------------------
CONFIG
----------------------------------------------------------*/

const port = 3000;
const app = express();

app.use(logger);

// app.use(session({
// 	secret: 'supersecret',
// 	resave: true,
// 	saveUninitialized: true
// }))

app.use(passport.initialize());
// app.use(passport.session());

// passport.serializeUser(function(user, done) {
// 	done(null, user.id);
// });

// passport.deserializeUser(function(id, done) {
// 	User.findById(id, function(err, user) {
// 		done(err, user);
// 	});
// });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/*----------------------------------------------------------
ROUTES
----------------------------------------------------------*/

// routes(app);

passport.use(
	new GitHubStrategy({
		clientID: githubConfig.clientID,
		clientSecret: githubConfig.clientSecret
	},
	function(accessToken, refreshToken, profile, done) {
		profile = _.omit(profile, '_json', '_raw');
		return done(null, { 
			name: 'github',
			userID: profile.id, 
			profile, 
			accessToken, 
			refreshToken 
		});
	}
));

app.get('/auth/:token', 
	function(req, res, next) {
		
		let { token } = req.params;

		AccessToken.findOne({ token })
			.then(accessToken => {
				
				if (!accessToken) return res.send(`Sorry, could not complete your request. The access token you have supplied has expired.`);
				let { userID, token, tokenTargetID, tokenType, options } = accessToken;

				if (tokenType === 'adapter') {
					return accessToken
						.remove()
						.then(() => createAdapterProfile(userID, tokenTargetID, options.adapterUserID))
						.then(user => res.send(`Thankyou ${user.fullname}`))
				}

				if (tokenType === 'service') {

					passport.authorize(tokenTargetID, {
						scope: options.scope,
						session: false,
						callbackURL: `/auth/${token}/callback`
					})(req, res, next);
				}

			})
			.catch(e => res.send(e));

	}
);
	
app.get('/auth/:token/callback',
	function(req, res, next) {
		
		let { token } = req.params;

		AccessToken.findOne({ token })
			.then(accessToken => {

				passport.authorize(accessToken.tokenTargetID, {
					scope: accessToken.options.scope,
					session: false,
					callbackURL: `/auth/${accessToken.token}/callback`
				})(req, res, next)

			});
			
	},
	function(req, res) {
		
		let { token } = req.params;
		let serviceProfile = req.account;

		const sendError = () => res.send(`Sorry, your access token could not be authenticated`);
		
		AccessToken.findOne({ token })
			.then(accessToken => {
				if (!accessToken) return res.send(`Sorry, could not complete your request. The access token you have supplied has expired.`);
				return User.findById(accessToken.userID)
			})
			.then(user => {
				if (!user) return sendError();
				user.services.push(serviceProfile);
				return user.save();
			})
			.then(user => {
				res.send('success!');
			})
			.catch(err => sendError());
	}
);

/*----------------------------------------------------------
ERROR LOGGING
----------------------------------------------------------*/

app.use(errorLogger);

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = function() {
	app.listen(port);
	console.log(`Webserver listening on port: ${port}`);
}