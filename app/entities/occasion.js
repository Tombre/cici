const createEntity = require('brain/createEntity'); 

let occasion = createEntity('occasion')
	.entries(['Christmas', 'Birthday'])

module.exports = {
	occasion
};