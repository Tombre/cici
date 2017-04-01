const createDialog = require('brain/createDialog');
const { fulfillChain } = require('helpers/fulfillment');
const { makeServiceAccessToken } = require('memory/accessToken');
const { requrieAuthenticatedUser } = require('memory/user');

/*----------------------------------------------------------
	Contexts
----------------------------------------------------------*/

const ASK_FOR_SERVICE = 'ASK_FOR_SERVICE';

/*----------------------------------------------------------
	Fulfillment
----------------------------------------------------------*/

const connectToService = next => (convo, response) => {
	let { service, user } = convo.getState();
	makeServiceAccessToken(user, service)
		.then(accessToken => {
			convo
				.say(`You can connect your ${service} account by clicking on this link http://localhost:3000/auth/${accessToken.token} (or copy and paste it into your browser).`)
		})
}

/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('authorise-service', dialog => {

	const SERVICE = dialog.param('service').entity('services');

	dialog.registerIntent(
		dialog.intent('start', true)
			.params([SERVICE])
			.userSays(params => [
				`Authorise a service`,
				`Authorise ${params.service('github')}`,
				`Connect ${params.service('github')}`
			])
			.fulfillWith(fulfillChain(
				requrieAuthenticatedUser,
				next => (convo, response) => {
					let { service } = response.meaning.parameters;
					if (!service) {
						return convo
							.setContext(ASK_FOR_SERVICE)
							.say('Which service would you like to connect to your account?')
					}
					convo.setState({ service });
					next();
				},
				connectToService
			))
	);

	dialog.registerIntent(
		dialog.intent('get-service')
			.requires(ASK_FOR_SERVICE)
			.params([SERVICE])
			.userSays(params => [params.service()], true)
			.fulfillWith(fulfillChain(
				next => (convo, response) => {
					let { service } = response.meaning.parameters;
					if (!service) {
						return convo
							.setContext(ASK_FOR_SERVICE)
							.say(`Sorry, that's not a service I can recognise`)
					}
					convo.setState({ service });
					next();
				},
				connectToService
			))
	);

});