const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { User, profileTypes } = require('memory/user');
const { chooseFor } = require('helpers/response');
const { setSubject, getSubject } = require('./helpers/state/general');
const { setUserToCreate, getUserToCreate } = require('./helpers/state/users');

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

profileTypes = Object.keys(profileTypes).map(_.capitalize);

/*----------------------------------------------------------
Contexts
----------------------------------------------------------*/

// question if the user should be created
const SET_USERS_NAME = 'SET_USERS_NAME';

/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

module.exports = createDialog('learnNewUser', dialog => {

	/*----------------------------------------------------------
	Helper
	----------------------------------------------------------*/

	function findContextProperty(contextName) {
		let indexOfProp = contextName.indexOf('.');
		if (indexOfProp >= 0) {
			return contextName.substr(indexOfProp + 1);
		}
	}

	function getFullNameFromFulfillment(response, state) {
		let { fullnameParam } = response.meaning.parameters;
		let { fullnameState } = state;
		if (fullnameState) return fullnameState;
		return fullnameParam;
	}

	/*----------------------------------------------------------
	Fullfillment
	----------------------------------------------------------*/

	function nameFulfillmentToProfileSetup(dispatch, response, state) {

		let { userToCreate } = state;
		let name = User.splitName(getFullNameFromFulfillment(response, state))

		userToCreate = Object.assign(userToCreate, {
			givenName: name[0],
			lastName: name[1]
		});

		let idSentance = chooseFor(state.subjectMatter, {
			'other': `Would you like to setup any profiles for this user?`,
			'self': `Would you like to setup any profiles?`
		})

		return dispatch
			.setState({ userToCreate })
			.setContext('setup-profile')
			.say(`${idSentance} At the moment I can learn from any of these:  ${profileTypes.join(', ')}`)
	}

	function evaluateForExistingUser(dispatch, response, state) {
		return User.getUserFromNameInResponse(response)
			.then(user => {
				if (user) return (dispatch
					.setContext('create-user-where-name-exists')
					.say(`${user.givenName} already exists, would you like to create another person by this name?`));
				return nameFulfillmentToProfileSetup(dispatch, response, state)
			})
			.catch(e => console.log(e))
	}

	/*----------------------------------------------------------
	Initial Intent
	----------------------------------------------------------*/

	// NEW USER
	dialog.registerIntent(
		dialog.intent('start', true)
			.userSays(params => [
				`learn a new user`,	
				`add new user`,
				`add user`,
				`create a new user`,
				`I need you to learn a new user`,
			])
			.fulfillWith((dispatch, response, state) => {
				
				if (!getSubject(state)) {
					dispatch.setState(setSubject(state, 'other');
				}

				return dispatch
					.setContext(SET_USERS_NAME)
					.say(chooseFor(state.subjectMatter, {
						'other': `What is the users full name?`
						'self': `What is your full name?`
					}));

			})
	)

	/*----------------------------------------------------------
	Naming
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('set-user-name')
			.requires(SET_USERS_NAME)
			.params([
				dialog.param('fullname').entity('sys.any')
			])
			.userSays(params => [
				`${params.fullname()}`,
			], true)
			.fulfillWith((dispatch, response) => {
				
				
				
			})
	)

	/*----------------------------------------------------------
	Where name already exists
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent.approval('create-user-where-name-exists')
			.fulfillWith((dispatch, response, state) => {
				return nameFulfillmentToProfileSetup(dispatch, response, state);
			}))

	dialog.registerIntent(
		dialog.intent.refusal('create-user-where-name-exists')
			.fulfillWith((dispatch, response) => {
				return dispatch
					.say('Ok')
					.endDialog()
			}))


});