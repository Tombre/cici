const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { higherOrderFulfill } = require('helper/responses');
const { User, getUserFromAdapterEvent } = require('memory/user');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

const respondWhenUserIsKnown = higherOrderFulfill(function(dispatch, response, state) {
	return return dispatch.say(`Hello ${user.givenName}`).endDialog();
}

const respondWhenUserUnkown = higherOrderFulfill(function(dispatch, response, state) {
	return dispatch
		.setContext('create-user')
		.say(`Hello, sorry I haven't met you yet Would you like  to setup a new user for yourself?`)
});

const respondForUser = higherOrderFulfill(function(dispatch, response, state) {
	return getUserFromAdapterEvent(response)
		.then(user => {
			if (user) return respondWhenUserIsKnown(dispatch, response, state);
			return respondWhenUserUnkown(dispatch, response, state);
		});
});

/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

module.exports = createDialog('introduction', dialog => {

	dialog.registerIntent(
		dialog.intent('intro', true)
			.params([
				dialog.param('fullname').entity('sys.any')
			])
			.userSays(params => [
				`Hi`,
				`Hey`,
				`Yo`,
				`Sup`,
				`Hi there`,
				`Heya`,
				`Hello`,
				`I'd like to introduce myself`,
			])
			.fulfillWith(respondForUser)
	)

	dialog.registerIntent(
		dialog.intent('intro-with-name', true)
			.params([
				dialog.param('fullname').entity('sys.any')
			])
			.userSays(params => [
				`Hi, I'm ${params.fullname('Joe Shatner')}`,
				`Hi, I'm ${params.fullname('Xavier')}`
			])
			.fulfillWith(respondForUser((dispatch, response, state) => {
				return getUserFromAdapterEvent(response)
					.then(user => {
						if (user) return dispatch.say(`Hello ${user.givenName}`).endDialog();
						
						let { fullname } = response.meaning.parameters;
						fullname =  (fullname) ? User.splitName(fullname) : '';
						return dispatch.setState({ 
							userToCreate: { fullname } 
						});
					})
			}))
	)

	dialog.registerIntent(
		dialog.intent.approval('create-user')
			.fulfillWith((dispatch, response, state) => {
				let mapToIntent = state.userToCreate.fullname ? 'learnNewUser/set-user-name' : 'learnNewUser/start';
				return dispatch
					.say(`Great. To get setup, I'll have to ask you a number of questions...`)
					.setState({ subjectMatter: 'self' })
					.mapToIntent(mapToIntent)
			}))

	dialog.registerIntent(
		dialog.intent.refusal('create-user')
			.fulfillWith((dispatch, response) => {
				return dispatch
					.say('Ok')
					.endDialog()
			}))


}