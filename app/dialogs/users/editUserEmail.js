const createDialog = require('brain/createDialog');
const { getUser } = require('state/users');
const { getSubjectResponse } = require('./userFactories');
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
				let user = convo.getState(getUser());
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
			.fulfillWith((convo, response) => {
				let { emailOrigional } = response.meaning.parameters;
				let email = emailOrigional;
				let user = convo.getState(getUser());

				if (!email || !isEmail(email)) {
					return convo
						.setContext(SET_ROLE_TOO)
						.say(`sorry, I wasn't able to recognise an email there. Can you try again?`);
				}

				return convo
					.action('setUser', { user, toSet: { email } })
					.say('ok, changing your email now')
					.mapToIntent('editUser/any-other-settings-to-change')
			})
	)

})