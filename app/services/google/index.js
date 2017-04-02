const GoogleStrategy = require('passport-google-oauth20').Strategy;
const googleConfig = require('config').services.google;
const _ = require('lodash');

module.exports = function() {
	return new GoogleStrategy(
		{
			clientID: googleConfig.clientID,
			clientSecret: googleConfig.clientSecret
		},
		function(accessToken, refreshToken, profile, done) {
			profile = _.omit(profile, '_json', '_raw');
			return done(null, { 
				name: 'google',
				userID: profile.id, 
				profile, 
				accessToken, 
				refreshToken 
			});
		}
	)
}