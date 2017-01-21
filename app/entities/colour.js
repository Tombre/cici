const createEntity = require('brain/createEntity'); 

let colour = createEntity('colour')
	.entries(['red', 'blue', 'green', 'yellow', 'orange', 'purple']);

module.exports = colour;