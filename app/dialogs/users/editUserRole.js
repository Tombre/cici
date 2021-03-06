const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { getUser } = require('state/users');
const { getSubjectResponse, setUserFromState } = require('./userHelpers');
const { fulfillChain } = require('helpers/fulfillment');
const { roleTypes, requirePermission } = require('memory/user');

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
			.fulfillWith(fulfillChain(
				requirePermission('admin', (convo, response) => {
					convo
						.say('you do not have the required permisions to edit roles')
						.mapToIntent('editUser/any-other-settings-to-change')
				}),
				next => (convo, response) => {
					let user = getUser(convo.getState());
					let roles = _.without(roleTypes, 'master').join('\n');
					let subject = getSubjectResponse(convo);
					convo
						.setContext(SET_ROLE_TOO)
						.say(`${subject} role is currently: "${user.role}", you can change it any one of these:\n${roles}\n\nWarning: Changing ${subject} role will effect what options can be run from ${subject} account.`)
				}
			))
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