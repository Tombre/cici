const { User } = require('memory/user');
const createAction = require('brain/createAction');

module.exports = createAction('setUser', function(dispatch, params) {

	let { user, toSet } = params;
	console.log(user);
	
});