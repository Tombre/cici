const _ = require('lodash');
const createDialog = require('brain/createDialog');
const { User, profileTypes } = require('memory/user');
const { chooseFor } = require('helpers/response');

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

profileTypes = Object.keys(profileTypes).map(_.capitalize);

/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

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

	function getFullNameFromFulfillment(response, state) {
		let { fullnameParam } = response.meaning.parameters;
		let { fullnameState } = state;
		if (fullnameState) return fullnameState;
		return fullnameParam;
	}

	/*----------------------------------------------------------
	Fullfillment
	----------------------------------------------------------*/

	function nameFulfillmentToProfileSetup(dispatch, response, state) {

		let { userToCreate } = state;
		let name = User.splitName(getFullNameFromFulfillment(response, state))

		userToCreate = Object.assign(userToCreate, {
			givenName: name[0],
			lastName: name[1]
		});

		let idSentance = chooseFor(state.subjectMatter, {
			'other': `Would you like to setup any profiles for this user?`,
			'self': `Would you like to setup any profiles?`
		})

		return dispatch
			.setState({ userToCreate })
			.setContext('setup-profile')
			.say(`${idSentance} At the moment I can learn from any of these:  ${profileTypes.join(', ')}`)
	}

	function evaluateForExistingUser(dispatch, response, state) {
		return User.getUserFromNameInResponse(response)
			.then(user => {
				if (user) return (dispatch
					.setContext('create-user-where-name-exists')
					.say(`${user.givenName} already exists, would you like to create another person by this name?`));
				return nameFulfillmentToProfileSetup(dispatch, response, state)
			})
			.catch(e => console.log(e))
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
				`I'd you to learn about ${params.givenName('William')} ${params.lastName('Shatner')}`
			])
			.fulfillWith((dispatch, response, state) => {
				
				if (!state.subjectMatter) {
					dispatch = dispatch.setState({ subjectMatter: 'other' });
				}

				let { givenName, lastName } = response.meaning.parameters;
				if (givenName) return evaluateForExistingUser(dispatch, response, state);

				return dispatch
					.setContext('set-user-name')
					.say(chooseFor(state.subjectMatter, {
						'other': `What is the users name?`
						'self': `What is your name?`
					}));
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
				if (givenName || lastName || fullname) return evaluateForExistingUser(dispatch, response, state);
			})
	)

	/*----------------------------------------------------------
	Where name already exists
	----------------------------------------------------------*/

	dialog.registerIntent(
		dialog.intent.approval('create-user-where-name-exists')
			.fulfillWith((dispatch, response, state) => {
				return nameFulfillmentToProfileSetup(dispatch, response, state);
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
					.say(chooseFor(state.subjectMatter, {
						'other': `What is the link to the users ${profileType}?`
						'selft': `What is the link to your ${profileType}?`
					}));
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
				let config = _.find(userConfiguration.profiles, { type: profileType});

				if (config) config.link = profileLink;

				return dispatch
					.setContext('setup-profile')
					.say(`Added profile for ${profileType}. Would you like to setup another profile?`);
				
			}));

	dialog.registerIntent(
		dialog.intent.refusal('setup-profile')
			.fulfillWith((dispatch, response) => {
				return dispatch
					.say('Ok, saving user')
					.action('newUser', { user: userConfiguration })
					.endDialog()
			}))


});