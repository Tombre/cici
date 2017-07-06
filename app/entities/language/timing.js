const createEntity = require('brain/createEntity'); 

let timing = createEntity('timing')
	.entries({
		'past': ['before', 'ahead', 'sooner', 'previous', 'last', 'past'],
		'present': ['now', 'present', 'current'],
		'future': ['after', 'later', 'afterward', 'next', 'before', 'future']
	});

module.exports = timing;