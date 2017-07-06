const GitHubStrategy = require('passport-github').Strategy;
const githubConfig = require('config').services.github;
const _ = require('lodash');
const makeAPI = require('helpers/api');

/*----------------------------------------------------------
	Setup
----------------------------------------------------------*/

function getAuthKey(user) {
	let service = _.find(user.services, { name: 'github' });
	if (service) return service.accessToken;
}

function wrapAPIwithAuth(fn) {
	return (user, entity, query, body) => {
		let headers = { 'Authorization': `token ${getAuthKey(user)}`};
		return fn(entity, query, body, headers);
	}
}

const API = makeAPI(
	({ entity }) => `https://api.github.com${entity}`,
	({ headers, type }) => { 
		headers = Object.assign({}, headers, { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Cici' });
		if (type !== 'get') headers['Content-Type'] = 'application/json; charset=utf-8';
		return headers;
	}
);

API.GET = wrapAPIwithAuth(API.GET);
API.POST = wrapAPIwithAuth(API.POST);
API.DELETE = wrapAPIwithAuth(API.DELETE);
API.PATCH = wrapAPIwithAuth(API.PATCH);
API.PUT = wrapAPIwithAuth(API.PUT);

/*----------------------------------------------------------
	API Library
----------------------------------------------------------*/

module.exports.getUserTasks = function(user) {
	return API.GET(user, '/issues')
}

/*----------------------------------------------------------
	Auth Strategy
----------------------------------------------------------*/

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