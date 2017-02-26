const createDialog = require('brain/createDialog');
const { getUser } = require('state/users');
const { getSubjectResponse } = require('./userFactories');
const { roleTypes } = require('memory/user');

/*----------------------------------------------------------
	Contexts
----------------------------------------------------------*/

const SET_ROLE_TOO = 'SET_ROLE_TOO';

/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('editUser-role', dialog => {

	/*----------------------------------------------------------
		Params
	----------------------------------------------------------*/

	const ROLE = dialog.param('role').entity('role');

	/*----------------------------------------------------------
		Intents
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('edit')
			.fulfillWith((convo, response) => {
				let user = convo.getState(getUser());
				let roles = roleTypes.join('\n');
				convo
					.setContext(SET_ROLE_TOO)
					.say(`${getSubjectResponse(convo)} role is currently: "${user.role}", you can change it any one of these:\n${roles}`)
			})
	)

	dialog.registerIntent(
		dialog.intent('set-role')
			.requires(SET_ROLE_TOO)
			.params([ROLE])
			.userSays(params => [params.role()], true)
			.fulfillWith((convo, response) => {
				let { role } = response.meaning.parameters;
				let user = convo.getState(getUser());
				if (role) {
					return 
						convo
							.action('setUser', { user, toSet: { role } })
							.say('ok, changing your role now')
							.mapToIntent('editUser/any-other-settings-to-change')
				} else {
					convo
						setContext(SET_ROLE_TOO)
						.say(`sorry, I wasn't able to recognise a role there. What would you like ${getSubjectResponse(convo)} role changed too?`);
				}
			})
	)

})