const createEntity = require('brain/createEntity'); 

let services = createEntity('services')
	.entries(['github', 'google', 'twitter', 'facebook'])

module.exports = services;