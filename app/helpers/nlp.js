const config = require('config')["api.ai"];
const _ = require('lodash');
const makeAPI = require('./api');

const API = makeAPI(
	({ entity, query }) => {
		let url = `https://api.api.ai/v1/${entity}/`;
		if (_.isPlainObject(query) && query.id) url += `${query.id}/`;
		url += `?v=${config.v}`;
		return url;
	},
	({ type, headers }) => { 
		headers = headers || {};
		headers['Authorization'] = `Bearer ${config.key}`;
		if (type !== 'get') headers['Content-Type'] = 'application/json; charset=utf-8';
		return headers;
	}
);

API.query = function(text, contexts, options) {
	let config =  _.assign({ 
		query: text,
		contexts,
		lang: 'en' 
	}, options);
	return API.req('post', 'query', null, config)
		.catch(e => console.log(e));
}

module.exports = API;