var mongoose = require('mongoose');

const profileTypes = ['Facebook', 'Slack', 'Twitter'];

const Users = mongoose.model('Users', { 
	givenName: String,
	lastName: String,
	profiles: [{
		type: String,
		link: String,
		id: String
	}]
});

module.exports = {
	Users,
	profileTypes
}