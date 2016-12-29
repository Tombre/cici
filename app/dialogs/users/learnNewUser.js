const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { Users } = require('memory');

module.exports = createDialog('learnNewUser', dialog => {

	/*----------------------------------------------------------
	Options setup
	----------------------------------------------------------*/

	const userConfiguration = {};

	/*----------------------------------------------------------
	Fullfillment
	----------------------------------------------------------*/

	function saveUser(dispatch, config) {
		return dispatch
			.say('understood, saving new user.')
			.action('saveUser', { user: config })
			.endDialog()
	}

	function evaluateForExistingUser(dispatch, response) {
		
		let { givenName, lastName, fullname } = response.parameters;
		
		if (fullname) {
			givenName = fullname.split(' ')[0];
			lastName = fullname.split(' ')[1];
		}

		return Users.findOne({ givenName, lastName }).exec()
			.then(user => {
				if (user) return (dispatch
					.setContext('user-exists')
					.say(`${user.givenName} already exists, would you like to create another person by this name?`));
				
				userConfiguration.givenName = givenName;
				userConfiguration.lastName = lastName;
				
				return saveUser(dispatch, userConfiguration)
			})
	}

	/*----------------------------------------------------------
	Intents
	----------------------------------------------------------*/

	// NEW USER
	dialog.registerIntent(
		dialog.intent('start', true)
			.params([
				dialog.param('givenName').entity('sys.given-name'),
				dialog.param('lastName').entity('sys.last-name')
			])
			.userSays(params => [
				`learn a new user`,	
				`add new user`,
				`add user`,
				`create a new user`,
				`I need you to learn a new user`,
				`I'd like to introduce you too ${params.givenName('Tom')}`,
				`I'd like to introduce you too ${params.givenName('Joe')} ${params.lastName('Blogs')}`,
				`I'd like to introduce you too ${params.givenName('Thomas')} ${params.lastName('Leenders')}`,
				`I'd you to learn about ${params.givenName('William')}`,
				`I'd you to learn about ${params.givenName('William')} ${params.lastName('Joe Shatner')}`
			])
			.fulfillWith((dispatch, response) => {
				let { givenName, lastName } = response.parameters;
				if (givenName) return evaluateForExistingUser(dispatch, response);
				return dispatch
					.setContext('set-user-details')
					.say(`What is the users name?`);
			})
	)

	dialog.registerIntent(
		dialog.intent('set-user')
			.requires('set-user-details')
			.params([
				dialog.param('givenName').entity('sys.given-name'),
				dialog.param('lastName').entity('sys.last-name'),
				dialog.param('fullname').entity('sys.any')
			])
			.userSays(params => [
				`${params.givenName()}`,
				`${params.givenName()} ${params.lastName()}`,
				`${params.fullname()}`,
			], true)
			.fulfillWith((dispatch, response) => {
				let { givenName, lastName, fullname } = response.parameters;
				if (givenName || lastName || fullname) return evaluateForExistingUser(dispatch, response);
			})
	)

	dialog.registerIntent(
		dialog.intent.approval('user-exists')
			.fulfillWith((dispatch, response) => {
				return saveUser(dispatch, userConfiguration);
			}))

	dialog.registerIntent(
		dialog.intent.refusal('user-exists')
			.fulfillWith((dispatch, response) => {
				return dispatch
					.say('Ok')
					.endDialog()
			}))



});