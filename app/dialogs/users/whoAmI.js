const createDialog = require('brain/createDialog');
const { getUserFromAdapterEvent } = require('memory/user');

/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('who-am-I', dialog => {

	/*----------------------------------------------------------
		Intents
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('show', true)
			.userSays(params => [
				`who am I?`,
				`whoami`,
				`What is my current user?`,
				`Do I have a user at the moment?`
			])
			.fulfillWith((convo, response) => {
				getUserFromAdapterEvent(response)
					.then(user => {
						if (!user) {
							return convo
								.say('You are currently not signed in to any user')
								.endDialog();
						}
						let { lastName, givenName, email} = user;
						convo
							.say(`Your user is ${lastName ? (givenName + ' ' + lastName) : givenName}: ${email}`)
							.endDialog();
					})
			})
	)

})