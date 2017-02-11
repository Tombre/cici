const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { setUserToCreate, getUserToCreate } = require('./helpers/state/users');
const { setSubject } = require('./helpers/state/general');
const { User, getUserFromAdapterEvent } = require('memory/user');

/*----------------------------------------------------------
Contexts
----------------------------------------------------------*/

// question if the user should be created
const SHOULD_CREATE_USER = 'SHOULD_CREATE_USER';

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/



const askToCreateUserIfNoneFound = function(subject) {
	return (dispatch, response, state) => {
		return getUserFromAdapterEvent(response)
			.then(user => {
				
				if (user) {
					return dispatch
						.say(`Hello ${user.givenName}`)
						.endDialog();
				}

				// if user is not known, ask if they want to have  user created for them

				let userToCreate = {};

				let { fullname } = response.meaning.parameters;
				if (fullname) {
					let [ givenName, lastName ] =  (fullname) ? User.splitName(fullname) : ['', ''];
					userToCreate.givenName = givenName;
					userToCreate.lastName = lastName;
				}
			
				dispatch
					.setState(setUserToCreate(state, userToCreate))
					.setState(setSubject(state, subject))
					.setContext(SHOULD_CREATE_USER)
					.say(`Hello, sorry I haven't met you yet Would you like  to setup a new user for yourself?`);
			
				cb(dispatch, response, state);

			});
	}
}

/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

module.exports = createDialog('newUser', dialog => {

	/*
	*	Introduction Intents
	*	Intents that allow the creation of new users via an introduction. If a user is already known, they 
	*/

	dialog.registerIntent(
		dialog.intent('intro', true)
			.params([
				dialog.param('fullname').entity('sys.any')
			])
			.userSays(params => [
				`I'd like to introduce myself`,
				`Hi, I'm ${params.fullname('Joe Shatner')}`,
				`Hi, I'm ${params.fullname('Xavier')}`
			])
			.fulfillWith(askToCreateUserIfNoneFound('self'))
	)

	dialog.registerIntent(
		dialog.intent('intro-for-3rd-party', true)
			.params([
				dialog.param('fullname').entity('sys.any')
			])
			.userSays(params => [
				`I'd like to introduce you too someone`,
				`I'd like to introduce you too ${params.fullname('Joe Shatner')}`,
				`I'd you to learn about ${params.fullname('Joe Shatner')}`
			])
			.fulfillWith(askToCreateUserIfNoneFound('other'));
	)

	dialog.registerIntent(
		dialog.intent.approval(SHOULD_CREATE_USER)
			.fulfillWith((dispatch, response, state) => {
				let userToCreate = getUserToCreate(state);
				let mapToIntent = userToCreate && userToCreate.fullname ? 'learnNewUser/set-user-name' : 'learnNewUser/start';
				return dispatch
					.say(`Affirmative. To get setup, I'll have to ask you a number of questions...`)
					.setState({ subjectMatter: 'self' })
					.mapToIntent(mapToIntent)
			}))

	dialog.registerIntent(
		dialog.intent.refusal(SHOULD_CREATE_USER)
			.fulfillWith((dispatch, response) => {
				return dispatch
					.say('Ok')
					.endDialog()
			}))


}