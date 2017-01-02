const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { Users, profileTypes } = require('memory/user');

module.exports = createDialog('learnNewUser', dialog => {

	/*----------------------------------------------------------
	Options setup
	----------------------------------------------------------*/

	const userConfiguration = {
		givenName: '',
		lastName: '',
		profiles: []
	};

	let currentProfile = '';

	/*----------------------------------------------------------
	Helper
	----------------------------------------------------------*/

	function findContextProperty(contextName) {
		let indexOfProp = contextName.indexOf('.');
		if (indexOfProp >= 0) {
			return contextName.substr(indexOfProp + 1);
		}
	}

	/*----------------------------------------------------------
	Fullfillment
	----------------------------------------------------------*/

	function fulfillWithProfileSetup(dispatch, response) {
		return dispatch
			.setContext('setup-profile')
			.say(`Would you like to setup any profiles for this user? At the moment I can learn from any of these:  ${profileTypes.join(', ')}`)
	}

	function evaluateForExistingUser(dispatch, response) {
		
		let { givenName, lastName, fullname } = response.meaning.parameters;
		
		if (fullname) {
			givenName = fullname.split(' ')[0];
			lastName = fullname.split(' ')[1];
		}

		return Users.findOne({ givenName, lastName }).exec()
			.then(user => {
				if (user) return (dispatch
					.setContext('create-user-where-name-exists')
					.say(`${user.givenName} already exists, would you like to create another person by this name?`));
				
				userConfiguration.givenName = givenName;
				userConfiguration.lastName = lastName;
				
				return fulfillWithProfileSetup(dispatch, userConfiguration)
			})
	}

	/*----------------------------------------------------------
	Initial Intent
	----------------------------------------------------------*/

	// NEW USER
	dialog.registerIntent(
		dialog.intent('start', true)
			.params([
				dialog.param('givenName').entity('sys.given-name'),
				dialog.param('lastName').entity('sys.last-name')
			])
			.userSays(params => [
				`learn a new user`,	
				`add new user`,
				`add user`,
				`create a new user`,
				`I need you to learn a new user`,
				`I'd like to introduce you too ${params.givenName('Tom')}`,
				`I'd like to introduce you too ${params.givenName('Joe')} ${params.lastName('Blogs')}`,
				`I'd like to introduce you too ${params.givenName('Thomas')} ${params.lastName('Leenders')}`,
				`I'd you to learn about ${params.givenName('William')}`,
				`I'd you to learn about ${params.givenName('William')} ${params.lastName('Joe Shatner')}`
			])
			.fulfillWith((dispatch, response) => {
				let { givenName, lastName } = response.meaning.parameters;
				if (givenName) return evaluateForExistingUser(dispatch, response);
				return dispatch
					.setContext('set-user-name')
					.say(`What is the users name?`);
			})
	)

	/*----------------------------------------------------------
	Naming
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('set-user-name')
			.requires('set-user-name')
			.params([
				dialog.param('givenName').entity('sys.given-name'),
				dialog.param('lastName').entity('sys.last-name'),
				dialog.param('fullname').entity('sys.any')
			])
			.userSays(params => [
				`${params.givenName()}`,
				`${params.givenName()} ${params.lastName()}`,
				`${params.fullname()}`,
			], true)
			.fulfillWith((dispatch, response) => {
				let { givenName, lastName, fullname } = response.meaning.parameters;
				if (givenName || lastName || fullname) return evaluateForExistingUser(dispatch, response);
			})
	)

	/*----------------------------------------------------------
	Where name already exists
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent.approval('create-user-where-name-exists')
			.fulfillWith((dispatch, response) => {
				return fulfillWithProfileSetup(dispatch, userConfiguration);
			}))

	dialog.registerIntent(
		dialog.intent.refusal('create-user-where-name-exists')
			.fulfillWith((dispatch, response) => {
				return dispatch
					.say('Ok')
					.endDialog()
			}))

	/*----------------------------------------------------------
	Setup Profile
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent('setup-profile')
			.requires('setup-profile')
			.params([
				dialog.param('profileType').entity('service'),
			])
			.userSays(params => {
				let examples = [
					`setup ${params.profileType('Facebook')}`,
					`setup profile for ${params.profileType('Twitter')}`,
					`${params.profileType('Slack')}`
				];
				examples = examples.concat(profileTypes.map(type => params.profileType(type)));
				return examples;
			})
			.fulfillWith((dispatch, response) => {
				let { profileType } = response.meaning.parameters;
				if (!profileType) return dispatch.setContext('setup-profile').say(`sorry, I'm not able to setup that profile type. I can setup any of these: ${profileTypes.join(', ')}`);
				if (!_.find(userConfiguration.profiles, { type: profileType })) {
					userConfiguration.profiles.push({ type: profileType });
				}
				return dispatch
					.setContext(['setup-profile', { name: 'setup-profile-link', parameters: { profileType } }])
					.say(`What is the link to the users ${profileType}?`);
			}));

	dialog.registerIntent(
		dialog.intent('setup-profile-link')
			.requires('setup-profile-link')
			.params([
				dialog.param('profileLink').entity('sys.any')
			])
			.userSays(params => [
				`${params.profileLink()}`
			], true)
			.fulfillWith((dispatch, response) => {

				let { profileLink } = response.meaning.parameters;
				let profileType = _.find(response.meaning.contexts, { name: 'setup-profile-link' }).parameters.profileType;
				
				if (userConfiguration.profiles[profileType]) {
					userConfiguration.profiles[profileType].link = profileLink;
				}

				return dispatch
					.setContext('setup-profile')
					.say(`Added profile for ${profileType}. Would you like to setup another profile?`);
				
			}));

	dialog.registerIntent(
		dialog.intent.refusal('setup-profile')
			.fulfillWith((dispatch, response) => {
				return dispatch
					.say('Ok, saving user')
					.action('saveUser', { user: userConfiguration })
					.endDialog()
			}))


});