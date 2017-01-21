const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { User, profileTypes } = require('memory/user');

module.exports = createDialog('setUser', dialog => {

	const userConfiguration = {
		givenName: '',
		lastName: '',
		profiles: []
	};

	dialog.registerIntent(
		dialog.intent('start', true)
		.userSays(params => [
			`I'd like to edit a user`
		])
		.fulfillWith((dispatch, response) => {
			return dispatch
				.setContext('set-user-name') 
		})
	);

	dialog.registerIntent(
		dialog.intent('start', true)
		.userSays(params => [
			`change name`
		])
		.fulfillWith((dispatch, response) => {
			return dispatch
				.setContext('set-user-name') 
		})
	);

});