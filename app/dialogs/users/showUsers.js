const createDialog = require('brain/createDialog');
const { User } = require('memory/user');

/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('show-users', dialog => {

	/*----------------------------------------------------------
		Intents
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('show', true)
			.userSays(params => [
				`show all users`,
				`show users`,
				`Who are currently users in the system?`,
				`What users do you know about?`,
				`Who do you know about?`,
				`Who are the people you know?`
			])
			.fulfillWith((convo, response) => {
				User.find({})
					.then(users => {
						if (users && users.length) {
							let userList = users.map(user => {
								let { fullname, email } = user;
								return `${fullname}: ${email}\n`;
							})
							convo.say(`These are the current users I know about:\n${userList.join('')}`);
						} else {
							convo.say(`I currently do not have any users in memory`);
						}
						convo.endDialog();
					})
					.catch(err => {
						console.log(err);
						convo.say('sorry, there was an error retrieving the users.').endDialog();
					})
			})
	)

})