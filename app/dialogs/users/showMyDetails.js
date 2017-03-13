const createDialog = require('brain/createDialog');
const _ = require('lodash');
const { getUserFromAdapterEvent } = require('memory/user');

/*----------------------------------------------------------
	Helpers
----------------------------------------------------------*/

function getUserDefinition(user) {
	let profiles = _.uniq(user.adapterProfiles.map(profile => profile.adapter)).join(', ');
	return [
		`First Name: ${user.givenName} `,
		`Last Name: ${user.lastName}`,
		`Role: ${user.role}`,
		`Email: ${user.email}`,
		`Profiles: ${profiles}`
	];
}


/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('show-my-details', dialog => {

	/*----------------------------------------------------------
		Intents
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('show', true)
			.userSays(params => [
				`What are my details?`,
				`What do you know about me?`,
				`Show my details`,
				`Show my user`,
				`who am I?`,
				`whoami`,
				`What is my current user?`,
				`Do I have a user at the moment?`
			])
			.fulfillWith((convo, response) => {
				getUserFromAdapterEvent(response)
					.then(user => {
						if (!user) {
							return convo
								.say('You are currently not signed in to any user')
								.endDialog();
						}
						convo
							.say(`Here are your details:\n${getUserDefinition(user).join('\n')}`)
							.endDialog();
					})
			})
	)

})