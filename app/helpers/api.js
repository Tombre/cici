const config = require('../../config.json')["api.ai"];
const _ = require('lodash');
const request = require('request');

function req(type, entity, query) {
	return new Promise((resolve, reject) => {
		const options = {
			json: true,
			url: `https://api.api.ai/v1/${entity}/`,
			headers: { 
				'Authorization': `Bearer ${config.key}` 
			}
		};

		if (_.isPlainObject(query) && query.id) options.url += `${query.id}/`
		options.url += `?v=${config.v}`;

		if (type !== 'get') options.headers['Content-Type'] = 'application/json; charset=utf-8';
		if (['post', 'patch', 'put'].indexOf(type) >= 0) options.body = query;
		if (type === 'get') options.qs = query;

		request[type](options, (error, response, body) => {
			if (error) return reject(error);
			let code = body.status && parseInt(body.status.code, 10);
			if (code && code >= 300 || code <= 199) {
				return reject(_.assign({
					msg: `API Status exception: ${type} - ${entity}`,
					query: query
				}, body));
			}
			return resolve(body)
		});
	})
}

function query(text, options) {
	let config =  _.assign({ 
		query: text,
		lang: 'en' 
	}, options);
	return req('get', 'query', config)
		.catch(e => console.log(e));
}

const GET = _.partial(req, 'get');
const POST = _.partial(req, 'post');
const DELETE = _.partial(req, 'delete');
const PATCH = _.partial(req, 'patch');
const PUT = _.partial(req, 'put');

module.exports = { req, GET, POST, DELETE, PATCH, PUT, query, config }