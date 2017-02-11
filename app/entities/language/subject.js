const createEntity = require('brain/createEntity'); 

/*
*	Subject
*	Subject identifies whome in the conversation someone is reffering too. Warning: this is essentially the same as possession, 
*	so don't use the two together.
*/

let subject = createEntity('subject')
	.entries({
		'self': ['me', 'I', 'my', 'myself', 'mine', 'ours', 'our']
		'bot': ['you', 'your', 'yours'],
		'other': ['his', 'hers', 'its', 'their', 'theirs'],
	});

module.exports = subject;