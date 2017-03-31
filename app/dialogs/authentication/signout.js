const createDialog = require('brain/createDialog');
const { fulfillChain } = require('helpers/fulfillment');
const { getUserFromAdapterEvent, getUserFromEmail, getAdapterProfile, User, removeAdapterProfile } = require('memory/user');

/*----------------------------------------------------------
	Contexts
----------------------------------------------------------*/

const CONFIRM_SIGNOUT = 'CONFIRM_SIGNOUT';

/*----------------------------------------------------------
	Fulfillment
----------------------------------------------------------*/


/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('sign-out', dialog => {

	/*----------------------------------------------------------
	Intents
	----------------------------------------------------------*/

	/*
	* 	Start Intent
	*	Kicks the signing off process
	*/

	dialog.registerIntent(
		dialog.intent('start', true)
			.userSays(params => [
				`sign me out`,
				`Can I sign out`,
				`unauthenticate me`,
				`Log me out`,
				`Log out`,
				`unauthenticate`
			])
			.fulfillWith((convo, response) => {
				getUserFromAdapterEvent(response)
					.then(user => {

						if (!user) {
							return convo.say('You are already unauthenticated').endDialog();
						}

						let { lastName, givenName, email} = user;
						return convo
							.setContext(CONFIRM_SIGNOUT)
							.setState({ user })
							.say(`You are currently logged in as ${lastName ? (givenName + ' ' + lastName) : givenName}: ${email}. Are you sure you want to sign out?`)

					});
			})
	)

	dialog.registerIntent(
		dialog.intent.approval(CONFIRM_SIGNOUT)
			.fulfillWith((convo, response) => {
				let { user } = convo.getState();
				removeAdapterProfile(user.id, response.adapterID)
					.then(user => convo.say(`you have been signed out`).endDialog())
					.catch(e => console.log(e))
			})
	)

	dialog.registerIntent(
		dialog.intent.refusal(CONFIRM_SIGNOUT)
			.fulfillWith((convo, response) => {
				convo.say('Ok').endDialog();
			})
	)

})