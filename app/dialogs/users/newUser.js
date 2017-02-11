const createDialog = require('brain/createDialog');
const { getUserFromAdapterEvent, getUserFromNameInResponse } = require('memory/user');
const { setSubject, getSubject } = require('helpers/state/general');
const { setUserToCreate, getUserToCreate } = require('helpers/state/users');
const { chooseFor } = require('helpers/response');

/*----------------------------------------------------------
Params
----------------------------------------------------------*/

const FULLNAME = dialog.param('fullname').entity('sys.any');
const SUBJECT = dialog.param('subject').entity('subject');
const RELATIONSHIP = dialog.param('relationship').entity('relationships');

/*----------------------------------------------------------
Contexts
----------------------------------------------------------*/

const IS_FOR_CURRENT_USER = 'IS_FOR_CURRENT_USER';
const ASK_FULL_NAME = 'ASK_FULL_NAME';

/*----------------------------------------------------------
Fulfillment
----------------------------------------------------------*/

/*
*	Ask if no name
*	If there is no name in the response, ask for one so we can set the name for the new user.
*/

function askIfNoName(fulfillment) {
	return (dispatch, response, state) => {

		let { fullname } = response.meaning.parameters;
		let subject = getSubject(state);
		
		if (!fullname || !getUserToCreate(state).fullname) {
			let subjector = chooseFor(subject, { "self": "your", "other": "the user's" }, 'your');
			return dispatch
				.say(`What is ${subjector} full name?`)
				.setContext()
		}

		return fulfillment(dispatch, response, state);

	}
}

/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

module.exports = createDialog('newUser', dialog => {

	/*
	*	Introduction
	*	This intent maps to a traditional introduction as though spoken in regular conversation when meeting someone. It will test
	*	for the subject, as well as relationship. The default subject is the user themselves. If a relationship is found, it will assume the subject is third person.
	*/

	dialog.registerIntent(
		dialog.intent('introduce', true)
			.params([FULLNAME, SUBJECT, RELATIONSHIP])
			.userSays(params => [
				`I'd like to introduce ${params.subject('myself')}`,
				`I'd like to introduce you too ${params.relationship('someone')}`,
				`I'd like to introduce you too ${params.subject('my')} ${params.relationship('friend')}`,
				`I'd you to learn about ${params.fullname('Joe Shatner')}`
				`I'd you to learn about ${params.subject('my')} ${params.relationsip('acquaintance')}`,
				`Hi, I'm ${params.fullname('Joe Shatner')}`,
				`Hello, I'm ${params.fullname('Xavier')}`
			])
			.fulfillWith((dispatch, response, state) => {

				let { parameters: { subject, relationship, fullname } } = response.meaning;
				if (relationship) subject = 'self';

				dispatch.setState(setSubject(state, subject));
				

			});
	)

	/*
	*	Command
	*	This intent directly opens the dialog for creating a new user. If the user who opened the dialog is not already a user of the system, we will
	* 	ask them to confim if the user is for themself or for someone else.
	*/

	dialog.registerIntent(
		dialog.intent('command', true)
			.userSays(params => [
				`learn a new user`,	
				`add new user`,
				`add user`,
				`create a new user`,
				`setup a user`,
				`I need you to learn a new user`,
			])
			.fulfillWith((dispatch, response, state) => {
				dispatch
					.setContext(IS_FOR_CURRENT_USER)
					.say('Is this user for yourself?')
			})
	)

	dialog.registerIntent(
		dialog.intent.approval(IS_FOR_CURRENT_USER)
			.fulfillWith((dispatch, response, state) => {
				dispatch.setState(setSubject('self'))
			})
	)

	dialog.registerIntent(
		dialog.intent.refusal(IS_FOR_CURRENT_USER)
			.fulfillWith((dispatch, response, state) => {
				dispatch
					.setState(setSubject('other'))
					.say()
			})
	)

	/*
	*	Get name
	*	Getting the name is the first 
	*/

});