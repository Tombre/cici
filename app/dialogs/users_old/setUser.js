const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { User } = require('memory/user');
const {} = require('./_helpers');

module.exports = createDialog('setUser', dialog => {

	dialog.registerIntent(
		dialog.intent('start', true)
			.userSays(params => [
				`I'd like to edit a user`,
				`I need to edit some details about me`,
				`I need to change what you know about me`
			])
			.fulfillWith((dispatch, response) => {
				return dispatch
					.setContext('set-user-name') 
			})
	);

});