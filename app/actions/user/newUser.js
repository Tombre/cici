const createAction = require('brain/createAction');
const { choose } = require('helpers/response');
const { User } = require('memory/user');
const _ = require('lodash');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function getAdapterID(convo) {
	return {
		adapter: convo.adapter,
		userID: convo.participant
	}
}

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('newUser', function(dispatch, def) {

	let { params: { user }, conversation } = def;
	
	// conosle.log('ADAPTER PROFILE')

	let defaults = {
		role: 'user',
		adapterProfiles: [getAdapterID(conversation)]
	};

	User.create(_.assign({}, defaults, user))
		.then(user => {
			console.log('THE CREATED USER', user);
		})
		.catch(error => {
			console.log(error);
			dispatch.say('an error occured while saving this user');
		});

});