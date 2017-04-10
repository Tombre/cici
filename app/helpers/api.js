const _ = require('lodash');
const request = require('request');

module.exports = function getAPI(
	getURL = (()=>{}), 
	getHeaders = (()=>{}), 
	getQuery = ((type, entity, query)=>query), 
	getBody = ((type, entity, body)=>body)
) {

	function req(type, entity, query, body) {

		const URL = getURL(type, entity, query, body);
		const HEADERS = getHeaders(type, entity, query, body);
		const QUERY = getQuery(type, entity, query);
		const BODY = getBody(type, entity, body);

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