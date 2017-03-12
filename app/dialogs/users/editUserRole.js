const createDialog = require('brain/createDialog');
const { getUser } = require('state/users');
const { getSubjectResponse, setUserFromState } = require('./userHelpers');
const { fulfillChain } = require('helpers/fulfillment');
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

	const ROLE = dialog.param('role').entity('userRole');

	/*----------------------------------------------------------
		Intents
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('edit')
			.fulfillWith((convo, response) => {
				let user = getUser(convo.getState());
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
			.fulfillWith(fulfillChain(
				next => (convo, response) => {
					let { role } = response.meaning.parameters;
					if (role) {
						convo.setState({ toSet: { role } })
						return next();
					}
					convo
						.setContext(SET_ROLE_TOO)
						.say(`sorry, I wasn't able to recognise a role there. What would you like ${getSubjectResponse(convo)} role changed too?`);
				},
				setUserFromState,
				next => (convo, response) => {
					convo
						.say('ok, changing your role now')
						.mapToIntent('editUser/any-other-settings-to-change')
				}
			)
		)
	)

})