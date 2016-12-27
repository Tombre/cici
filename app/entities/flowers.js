const createEntity = require('brain/createEntity'); 

let flowerType = createEntity('flowerType')
	.entries(['rose', 'lilly'])

module.exports = {
	flowerType
};