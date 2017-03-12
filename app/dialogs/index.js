
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
	require('./users/whoAmI')
	
];