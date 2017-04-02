const createDialog = require('brain/createDialog');
const { fulfillChain } = require('helpers/fulfillment');
const { requireService } = require('memory/accessToken');
const { requrieAuthenticatedUser } = require('memory/user');

module.exports = createDialog('calendar', dialog => {


	dialog.registerIntent(
		dialog.intent('start', true)
			.userSays(params => [
				`calendar`
			])
			.fulfillWith(fulfillChain(
				requrieAuthenticatedUser,
				requireService('google', ['profile']),
				next => (convo, response) => {
					convo.say('Yay you are authenticated to google!');
				}
			))
	)


});