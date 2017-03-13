const createDialog = require('brain/createDialog');
const { getUser } = require('state/users');
const { getSubject } = require('state/general');
const { getSubjectResponse, setUserFromState } = require('./userHelpers');
const { fulfillChain } = require('helpers/fulfillment');

/*----------------------------------------------------------
	Contexts
----------------------------------------------------------*/

const SET_NAME_TOO = 'SET_NAME_TOO';

/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('editUser-name', dialog => {

	/*----------------------------------------------------------
		Params
	----------------------------------------------------------*/

	const FULLNAME = dialog.param('fullname').entity('sys.any');

	/*----------------------------------------------------------
		Intents
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('edit')
			.fulfillWith((convo, response) => {
				let user = getUser(convo.getState());
				convo
					.setContext(SET_NAME_TOO)
					.say(`${getSubjectResponse(convo)} name is currently: "${user.fullname}", what would you like it to be changed to?`)
			})
	)

	dialog.registerIntent(
		dialog.intent('set-name')
			.requires(SET_NAME_TOO)
			.params([FULLNAME])
			.userSays(params => [params.fullname()], true)
			.fulfillWith(fulfillChain(
				next => (convo, response) => {
					let { fullname } = response.meaning.parameters;
					if (fullname) {
						convo.setState({ toSet: { fullname } });
						return next();
					}
					convo
						.setContext(SET_NAME_TOO)
						.say(`sorry, I wasn't able to recognise a name there. What would you like ${getSubjectResponse(convo)} name changed too?`);
				},
				setUserFromState,
				next => (convo, response) => {
					convo
						.say('ok, your name has been changed')
						.mapToIntent('editUser/any-other-settings-to-change');
				}
			)
		)
	)

})