const createEntity = require('brain/createEntity'); 

/*
*	Relationships
*	The relationship someone may have to another as described in the dialog
*/

let relationships = createEntity('relationships')
	.entries({
		'partner': ['boyfriend', 'girlfriend', 'partner', 'wife', 'husband'],
		'parent': ['dad', 'mum', 'father', 'mother'],
		'sibling': ['sister', 'bother', 'step-sister', 'step-brother'],
		'relative': ['cousin', 'aunt', 'uncle', 'niece', 'nephew'],
		'descendant': ['child', 'children', 'grandchild'],
		'ancestor': ['grandparent', 'grandmother', 'parent']
		'acquaintance': ['workmate', 'colleague', 'employer', 'employee', 'friend', 'mentor', 'someone', 'dude', 'man']
	});

module.exports = relationships;