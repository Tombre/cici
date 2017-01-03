var mongoose = require('mongoose');

const profileTypes = ['Facebook', 'Slack', 'Twitter'];

const userShema = mongoose.Schema({
	givenName: String,
	lastName: String,
	profiles: [{
		type: String,
		link: String,
		id: String
	}]
});

const User = mongoose.model('User', userShema);

module.exports = {
	User,
	profileTypes
}