const createDialog = require('brain/createDialog');


/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

module.exports = createDialog('random', dialog => {

	dialog.registerIntent(
		dialog.intent('who', true)
			.userSays(params => [
				`Who am I`,
			])
			.fulfillWith((convo, response) => convo.say('Not sure, who are you?').endDialog())
	)

});