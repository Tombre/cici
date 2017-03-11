const createDialog = require('brain/createDialog');
const _ = require('lodash');
const { getUsersFromName, getUserFromEmail, getUserFromAdapterEvent } = require('memory/user');
const { setUser, getUser } = require('state/users');
const { setSubject, getSubject } = require('state/general');
const { getSubjectResponse } = require('./userFactories');
const { fulfillChain } = require('helpers/fulfillment');

/*----------------------------------------------------------
	Helper
----------------------------------------------------------*/

function tryGetUser(userDocument, event) {
	return getUserFromAdapterEvent(event)
		.then(user => {
			if (!user && userDocument.email) return getUserFromEmail(userDocument.email);
			return user;
		})
}

function getEditCommands(params, param, example) {
	return [
		`${params[param](example)}`,
		`edit ${params[param](example)}`,
		`set ${params[param](example)}`,
		`change ${params[param](example)}`,
		`the ${params[param](example)} please`
	]
}

function getUserDefinition(user) {
	return [
		`First Name: ${user.givenName} `,
		`Last Name: ${user.lastName}`,
		`Role: ${user.role}`,
		`Email: ${user.email}`
	];
}

function userSettingsToChangeFullfillment(convo, user) {
	convo
		.setState(setUser(user))
		.setContext(CHOOSE_FROM_EDIT_LIST)
		.say(`Which setting would you like to edit for ${user.givenName}?\n${getUserDefinition(user).join('\n')}`);
}

/*----------------------------------------------------------
	Contexts
----------------------------------------------------------*/

const NO_USER_SELECTED = 'NO_USER_SELECTED';
const CHOOSE_FROM_USER_LIST = 'CHOOSE_FROM_USER_LIST' ;
const CHOOSE_FROM_EDIT_LIST = 'CHOOSE_FROM_EDIT_LIST';
const ASK_FOR_SETTINGS_TO_CHANGE = 'ASK_FOR_SETTINGS_TO_CHANGE';

/*----------------------------------------------------------
	Fulfillment
----------------------------------------------------------*/

const chooseToEditUserFromEvent = next => (convo, response) => {
	getUserFromAdapterEvent(response)
		.then(function(user) {
			if (user) return userSettingsToChangeFullfillment(convo, user);
			return convo
				.say(`Looks like you aren't a registered user yet. You need to be registered to edit a user`)
				.mapToIntent('newUser/should-create-new-user-self');
		})
}

/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

module.exports = createDialog('editUser', dialog => {

	/*----------------------------------------------------------
	Params
	----------------------------------------------------------*/

	const FULLNAME = dialog.param('fullname').entity('sys.any');
	const EMAIL = dialog.param('email').entity('sys.any');
	const EMAIL_ORIGINAL = dialog.param('emailOrigional').setValue('\$email.original');
	const NUMBER = dialog.param('number').entity('sys.ordinal');
	const USER_SETTINGS = dialog.param('userSetting').entity('userSetting');
	const SUBJECT = dialog.param('subject').entity('subject');

	/*----------------------------------------------------------
	Intents
	----------------------------------------------------------*/

	/*
	*	Introduction
	*	Ask to edit a user setting. These intents will open up the edit dialog. If no user 
	*/

	dialog.registerIntent(
		dialog.intent('edit-user', true)
			.params([SUBJECT])
			.userSays(params => [
				`I'd like to edit a user`,
				`edit user`,
				`can you fix some user settings`,
				`change user settings`,
				`Go to user config`,
				`edit ${params.subject('my')} user settings`,
				`edit ${params.subject('my')} config`,
				`change ${params.subject('my')} user settings`
			])
			.fulfillWith(fulfillChain(
				next => (convo, response) => {
					let { subject } = response.meaning.parameters;
					convo.setState(setSubject(subject));
					if (subject !== 'self') {
						// if it's not for yourself, select a user first (don't go to the next fulfillment in the chain)
						return convo
							.setContext(NO_USER_SELECTED)
							.say('What is the name of the user would you like to edit (or is it yourself)?')
					}
					next();
				},
				chooseToEditUserFromEvent
			))
	)

	/*
	*	Select a user
	*	If no specific user can be determined from the initial intent, then we need to try and get one from the user
	*/

	dialog.registerIntent(
		dialog.intent('select-self')
			.requires(NO_USER_SELECTED)
			.userSays(params => [
				`It's me`,
				`It's for me`,
				`I'm the user`
			])
			.fulfillWith(fulfillChain(
				next => (convo, response) => {
					convo.setState(setSubject('self'));
					next();
				},
				chooseToEditUserFromEvent)
			)
	)

	dialog.registerIntent(
		dialog.intent('select-user')
			.requires(NO_USER_SELECTED)
			.params([FULLNAME])
			.userSays(params => getEditCommands(params, 'fullname', 'Joe Blogs'))
			.fulfillWith((convo, response) => {
				let { parameters: { fullname } } = response.meaning;
				if (fullname) {
					getUsersFromName(fullname)
						.then(users => {
							if (!users || !users.length) {
								convo
									.setContext(NO_USER_SELECTED)
									.say(`sorry, I don't know about anyone with that name. Try again with a different name?`)
							} else if (users.length > 1) {
								convo
									.setContext(CHOOSE_FROM_USER_LIST)
									.setState({ userList: users })
									.say(`Which one of these people do you mean? \n ${users.map((user, i) => `${i+1}. ${user.email}\n`)}`)
							} else {
								let user = users[0];
								userSettingsToChangeFullfillment(convo, user);
							}
						})
				}
			})
	)

	dialog.registerIntent(
		dialog.intent('selct-from-user-list')
			.requires(CHOOSE_FROM_USER_LIST)
			.params([EMAIL, EMAIL_ORIGINAL, NUMBER])
			.userSays(params => [
					`number ${params.number(1)}`,
					`${params.number(1)}, ${params.email('Joe.blogs@blog.com')}`
				]
				.concat(getEditCommands(params, 'email', 'Joe.blogs@blog.com'))
				.concat(getEditCommands(params, 'number', '1'))
			)
			.fulfillWith((convo, response) => {
				
				let { emailOrigional, number } = response.meaning.parameters;
				let email = emailOrigional;
				let { userList } = convo.getState();
				let user;

				if (number && userList[number]) {
					user = userList[number];
				} else if (email) {
					user = _.find(userList, { email });
				}

				if (user) return userSettingsToChangeFullfillment(convo, user);
				return convo
					.setContext(CHOOSE_FROM_USER_LIST)
					.set(`Sorry, I wasn't able to recognise that user, which one of these people do you mean? \n ${userList.map((user, i) => `${i+1}. ${user.email}\n`)}`)

			})
	)

	/*
	*	Choose to edit a part of the users settings
	*	Choose which setting to edit for a particular user
	*/

	dialog.registerIntent(
		dialog.intent('select-from-edit-list')
			.requires(CHOOSE_FROM_EDIT_LIST)
			.params([USER_SETTINGS])
			.userSays(params => getEditCommands(params, 'userSetting', 'name'))
			.fulfillWith((convo, response) => {
				let { userSetting } = response.meaning.parameters;
				if (!userSetting) { 
					return convo
						.setContext(CHOOSE_FROM_EDIT_LIST)
						.say(`Sorry, I wasn't able to understand which setting you meant. Which one of the above would you like to edit?`)
				}
				convo
					.mapToIntent(`editUser-${userSetting}/edit`);
			})
	)


	/*
	*	Any other intents to change
	*	Ask if you'd like to change any other settings
	*/


	dialog.registerIntent(
		dialog.intent('any-other-settings-to-change')
			.fulfillWith((convo, response) => {
				convo
					.setContext(ASK_FOR_SETTINGS_TO_CHANGE)
					.say('Would you like to change any other settings?');
			})
	)

	dialog.registerIntent(
		dialog.intent.approval(ASK_FOR_SETTINGS_TO_CHANGE)
			.fulfillWith((convo, response) => userSettingsToChangeFullfillment(convo, getUser(convo.getState())))
	)

	dialog.registerIntent(
		dialog.intent.refusal(ASK_FOR_SETTINGS_TO_CHANGE)
			.fulfillWith((convo, response) => {
				convo
					.say('Ok')
					.endDialog()
			})
	)


});