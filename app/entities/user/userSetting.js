const createEntity = require('brain/createEntity'); 

let userSetting = createEntity('userSetting')
	.entries({
		'name': ['name', 'fullname', 'full name', 'last name', 'given name'],
		'role': ['role', 'permissions'],
		'email': ['email', 'email address'],
		'profile': ['profile']
	});

module.exports = userSetting;