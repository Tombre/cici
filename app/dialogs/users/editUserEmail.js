const createDialog = require('brain/createDialog');
const { getUser } = require('state/users');
const { getSubjectResponse, setUserFromState } = require('./userHelpers');
const { fulfillChain } = require('helpers/fulfillment');
const isEmail = require('validator/lib/isEmail');

/*----------------------------------------------------------
	Contexts
----------------------------------------------------------*/

const SET_EMAIL_TOO = 'SET_EMAIL_TOO';

/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('editUser-email', dialog => {

	/*----------------------------------------------------------
		Params
	----------------------------------------------------------*/

	const EMAIL = dialog.param('email').entity('sys.any');
	const EMAIL_ORIGINAL = dialog.param('emailOrigional').setValue('\$email.original');

	/*----------------------------------------------------------
		Intents
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('edit')
			.fulfillWith((convo, response) => {
				let user = getUser(convo.getState());
				convo
					.setContext(SET_EMAIL_TOO)
					.say(`${getSubjectResponse(convo)} email is currently: "${user.email}", what would you like it changed too?`)
			})
	)

	dialog.registerIntent(
		dialog.intent('set-role')
			.requires(SET_EMAIL_TOO)
			.params([EMAIL, EMAIL_ORIGINAL])
			.userSays(params => [params.email()], true)
			.fulfillWith(fulfillChain(
				next => (convo, response) => {
					let { emailOrigional } = response.meaning.parameters;
					let email = emailOrigional;
					if (!email || !isEmail(email)) {
						return convo
							.setContext(SET_EMAIL_TOO)
							.say(`sorry, I wasn't able to recognise an email there. Can you try again?`);
					}
					convo.setState({ toSet: { email } });
					next();
				},
				setUserFromState,
				next => (convo, response) => {
					convo
						.say('ok, the email address has been updated')
						.mapToIntent('editUser/any-other-settings-to-change')
				}
			))
	)

})