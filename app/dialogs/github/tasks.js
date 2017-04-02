const createDialog = require('brain/createDialog');
const { fulfillChain } = require('helpers/fulfillment');
const { requireService } = require('memory/accessToken');
const { requrieAuthenticatedUser } = require('memory/user');

module.exports = createDialog('tasks', dialog => {


	dialog.registerIntent(
		dialog.intent('start', true)
			.userSays(params => [
				`what tasks do I have`,
				`What are my tasks?`
			])
			.fulfillWith(fulfillChain(
				requrieAuthenticatedUser,
				requireService('github', ['repo']),
				next => (convo, response) => {
					convo.say('Yay you are authenticated to github!');
				}
			))
	)


});