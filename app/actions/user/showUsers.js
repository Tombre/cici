const createAction = require('brain/createAction');
const { User } = require('memory/user');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('showUsers', function(dispatch, def) {
	
	User.find({})
		.then(users => {
			if (users && users.length) {
				let userList = users.map(user => {
					let { givenName, lastName, email } = user;
					return `${lastName ? (givenName + ' ' + lastName) : givenName}: ${email}\n`;
				})
				return dispatch.say(`These are the current users I know about:\n${userList.join('')}`);
			}
			dispatch.say(`I currently do not have any users in memory`);
		})
		.catch(err => console.log(err))

});