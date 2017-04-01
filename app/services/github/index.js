const GitHubStrategy = require('passport-github').Strategy;
const githubConfig = require('config').services.github;
const _ = require('lodash');

module.exports.scopes = ['user:email' ];

module.exports.strategy = function() {
	return new GitHubStrategy(
		{
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
	)
}