const createEntity = require('brain/createEntity'); 

let colour = createEntity('colour')
	.entries(['red', 'blue', 'green', 'yellow', 'orange', 'purple']);

let flowerType = createEntity('flowerType')
	.entries(['rose', 'lilly'])

let occasion = createEntity('occasion')
	.entries(['Christmas', 'Birthday'])

module.exports = {
	colour,
	flowerType,
	occasion
};