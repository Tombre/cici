const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { debugToggle } = require('brain/events/debug');

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
					.dispatch(debugToggle(true, response.author))
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
					.dispatch(debugToggle(false, response.author))
					.clearContext(true)
					.say('Debug mode stopped')
			}))

});