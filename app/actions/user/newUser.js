const createAction = require('brain/createAction');
const { choose } = require('helpers/response');
const { sendMessage } = require('brain/events/message');
const { User } = require('memory/user');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('newUser', function(dispatch, params) {

	let user = params.user;
	console.log('creating', params.user);

	// var kitty = new User({ 
	// 	givenName: user.givenName,
	// 	lastName: user.lastName,
	// 	profiles: user.profiles.map(profile => {
	// 		const { type, link } = profile;
	// 		return { type, link };
	// 	})
	// });
	
});