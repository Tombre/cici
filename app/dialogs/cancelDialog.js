const _ = require('lodash');
const createDialog = require('brain/createDialog');

module.exports = createDialog('cancelDialog', dialog => {

	dialog.registerIntent(
		dialog.intent('cancel', true)
			.userSays(params => [
				`nevermind`,
				`cancel`,
				`I've changed my mind`,
				`cancel dialog`,
				`end dialog`,
				`I don't care anymore`
			])
			.fulfillWith((dialog, response) => {
				return dialog
					.clearContext(true)
					.say('ok, no worries')
					.endDialog()
			}))

});