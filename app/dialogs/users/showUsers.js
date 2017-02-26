const createDialog = require('brain/createDialog');

/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('show-users', dialog => {

	/*----------------------------------------------------------
		Intents
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('show', true)
			.userSays(params => [
				`show all users`,
				`show users`,
				`Who are currently users in the system?`,
				`What users do you know about?`,
				`Who do you know about?`,
				`Who are the people you know?`
			])
			.fulfillWith((convo, response) => {
				convo
					.action('showUsers')
					.endDialog();
			})
	)

})