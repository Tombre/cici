const _ = require('lodash');
const createDialog = require('brain/createDialog');

module.exports = createDialog('debug', dialog => {

	dialog.registerIntent(
		dialog.intent('start', true)
			.userSays(params => [
				`debug mode`,
				`enable debug mode`,
				`debug`,
				`start debug mode`,
				`begin debug`,
				`start verbose mode`,
				`verbose mode`
			])
			.fulfillWith((dialog, response) => {
				return dialog
					.action('debugMode', { enabled: true, conversationID: response.conversationID })
					.clearContext(true)
					.say('Debug mode started')
			}))

	dialog.registerIntent(
		dialog.intent('stop', true)
			.userSays(params => [
				`Back to regular conversation`,
				`end debug mode`,
				`disable debug mode`,
				`end debug`,
				`stop debug`,
				`stop verbose mode`,
				`end verbose mode`
			])
			.fulfillWith((dialog, response) => {
				return dialog
					.action('debugMode', { enabled: false, conversationID: response.conversationID })
					.clearContext(true)
					.say('Debug mode stopped')
			}))

});