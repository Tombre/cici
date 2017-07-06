const _ = require('lodash');
const request = require('request');

module.exports = function getAPI(
	getURL = (()=>{}), 
	getHeaders = (()=>{}), 
	getQuery = (({ query })=>query), 
	getBody = (({ body })=>body)
) {

	function req(type, entity, query, body, headers) {

		const URL = getURL({ type, entity, query, body, headers });
		const HEADERS = getHeaders({ type, entity, query, body, headers });
		const QUERY = getQuery({ type, entity, query, headers });
		const BODY = getBody({ type, entity, body, headers });

		return new Promise((resolve, reject) => {
			
			const options = {
				json: true,
				url: URL,
				headers: HEADERS
			};
			
			options.body = BODY;
			options.qs = QUERY;

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

	return { req, GET, POST, DELETE, PATCH, PUT };
	
}