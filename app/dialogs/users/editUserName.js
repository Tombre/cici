const createDialog = require('brain/createDialog');
const { getUser } = require('state/users');
const { getSubject } = require('state/general');
const { getSubjectResponse } = require('./userFactories');

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
				console.log('THE USER', user);
				convo
					.setContext(SET_NAME_TOO)
					.say(`${getSubjectResponse(convo)} name is currently: "${user.lastName ? (user.givenName + ` ${user.lastName}`) : user.givenName }", what would you like it to be changed to?`)
			})
	)

	dialog.registerIntent(
		dialog.intent('set-name')
			.requires(SET_NAME_TOO)
			.params([FULLNAME])
			.userSays(params => [params.fullname()], true)
			.fulfillWith((convo, response) => {
				let { fullname } = response.meaning.parameters;
				let user = getUser(convo.getState());
				if (fullname) {
					const next = () => convo.mapToIntent('editUser/any-other-settings-to-change');
					return convo
						.say('ok, changing your name now')
						.action('setUser', { user, toSet: { fullname }, next })
				}
				convo
					.setContext(SET_NAME_TOO)
					.say(`sorry, I wasn't able to recognise a name there. What would you like ${getSubjectResponse(convo)} name changed too?`);
			})
	)

})