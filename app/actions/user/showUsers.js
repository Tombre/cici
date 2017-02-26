const createAction = require('brain/createAction');
const { sendMessage } = require('brain/events/message');
const { User } = require('memory/user');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('showUsers', function(dispatch, params) {

	let message = params.message;

	const say = (text) => {
		let config = { text, adapterID: message.adapterID };
		dispatch(sendMessage(config));
	};

	User.find({})
		.then(users => {
			if (users && users.length) {
				let userList = users.map(user => {
					let { givenName, lastName, email } = user;
					return `${lastName ? (givenName + ' ' + lastName) : givenName}: ${email}\n`;
				})
				say(`These are the current users I know about:\n${userList.join('')}`);
			}

			say(`I currently do not have any users in memory`);

		})
		.catch(err => console.log(err))

});