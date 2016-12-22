const config = require('../../config.json')["api.ai"];
const _ = require('lodash');
const request = require('request');

const api_key = config.key;
const v = config.v;

function req(type, entity, query) {
	return new Promise((resolve, reject) => {
		const options = {
			json: true,
			url: `https://api.api.ai/v1/${entity}/`,
			headers: { 
				'Authorization': `Bearer ${api_key}` 
			}
		};

		if (_.isPlainObject(query) && query.id) options.url += `${query.id}/`
		options.url += `?v=${v}`;

		if (type !== 'get') options.headers['Content-Type'] = 'application/json; charset=utf-8';
		if (['post', 'patch', 'put'].indexOf(type) >= 0) options.body = query;

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

const GET = _.partial(req, 'get');
const POST = _.partial(req, 'post');
const DELETE = _.partial(req, 'delete');
const PATCH = _.partial(req, 'patch');
const PUT = _.partial(req, 'put');

module.exports = { req, GET, POST, DELETE, PATCH, PUT }