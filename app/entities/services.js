const createEntity = require('brain/createEntity'); 
const { profileTypes } = require('memory/user');

let service = createEntity('service')
	.entries([...profileTypes])

module.exports = {
	service
};