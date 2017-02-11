const createEntity = require('brain/createEntity'); 

/*
*	Possession
*	Possession identifies who owns an entity in the conversation someone is reffering too. Warning: this is essentially the same as subject, 
*	so don't use the two together.
*/

let possession = createEntity('possession')
	.entries({
		'self': ['mine', 'ours', 'our', 'my'],
		'bot': ['your', 'yours'],
		'other': ['his', 'hers', 'its', 'their', 'theirs']
	});

module.exports = possession;