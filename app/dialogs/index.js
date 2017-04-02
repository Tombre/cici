
module.exports = [
	// require('./createbouquet'),
	
	// System
	require('./cancelDialog'),
	require('./diagnostics/debug'),
	
	// General
	require('./general/greetings'),
	
	// User
	require('./users/newUser'),
	require('./users/editUser'),
	require('./users/editUserEmail'),
	require('./users/editUserName'),
	require('./users/editUserRole'),
	require('./users/showUsers'),

	require('./users/showMyDetails'),

	// Authentication
	require('./authentication/signin'),
	require('./authentication/signout'),
	// require('./authentication/authoriseService')

	// Github
	require('./github/tasks'),

	// Google
	require('./google/calendar')
	
];