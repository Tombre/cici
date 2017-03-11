const { User } = require('memory/user');
const { setUser } = require('state/users');
const createAction = require('brain/createAction');

module.exports = createAction('setUser', function(dispatch, def) {

	let { params: { user, toSet, next }, conversation } = def;

	User.findById(user.id)
		.then(user => {
			Object.assign(user, toSet);
			return user.save();
		})
		.then(user => {
			console.log('does this happen?', user);
			conversation.setState(setUser(user))
			if (next) next();
		})
		.catch(err => {
			console.log('error?')
			conversation
				.say(`Sorry an error occured, I cannot update the user at this time`)
				.endDialog()
		})
		
});