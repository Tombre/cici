const createDialog = require('brain/createDialog');
const isEmail = require('validator/lib/isEmail');
const { getUserFromAdapterEvent, getUserFromNameInResponse } = require('memory/user');
const { setSubject, getSubject } = require('helpers/state/general');
const { setUserToCreate, getUserToCreate } = require('helpers/state/users');
const { chooseFor, fulfillChain } = require('helpers/response');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function getSubjectResponse(convo) {
	let subject = getSubject(convo.getState());
	return chooseFor(subject, { "self": "your", "other": "the user's" }, 'your');
}

/*----------------------------------------------------------
	Contexts
----------------------------------------------------------*/

const IS_FOR_CURRENT_USER = 'IS_FOR_CURRENT_USER';
const ASK_FULL_NAME = 'ASK_FULL_NAME';
const ASK_FOR_EMAIL = 'ASK_FOR_EMAIL';
const ASK_TO_CONFIRM_USER = 'ASK_TO_CONFIRM_USER';

/*----------------------------------------------------------
Fulfillment
----------------------------------------------------------*/

/*
*	respond for missing info
*	Will ask for missing info
*/

const askForMissingKeyInfo = next => (convo, response) => {

	let { fullname, email } = getUserToCreate(convo.getState());
	
	if (!fullname) {
		convo.setContext(ASK_FULL_NAME).say(`What is ${getSubjectResponse(convo)} full name?`)
	} else if (!email) {
		convo.setContext(ASK_FOR_EMAIL).say(`What is ${getSubjectResponse(convo)} email?`);
	} else {
		convo
			.setContext(ASK_TO_CONFIRM_USER)
			.say(`That's all the info I need for now. Does this look right to you? \n Name: ${fullname} \n Email: ${email}`)
	}
	
	next();

}


/*
*	Set subject
*	when setting a new user, subject can be "self" or "other".
*/

const setConversationSubject = next => (convo, response) => {
	let { parameters: { subject, relationship } } = response.meaning;
	if (relationship) subject = 'self';
	if (!subject) subject = 'other';
	convo.setState(setSubject(subject));
	next();
}


/*
*	Set user name
*	If there is a fullname in the response, then set it to the user to create portion of the state
*/

const setUserName = next => (convo, response) => {
	let { fullname } = response.meaning.parameters;
	let userToCreate = getUserToCreate(convo.getState());
	if (fullname) {
		userToCreate.fullname = fullname;
		convo
			.say(`Ok`)
			.setState(setUserToCreate(userToCreate));
	} else {
		convo.say(`sorry, I wasn't able to recognise a name there.`);
	}
	return next();
}


/*
*	Set user email
*	If there is a emai; in the response, then set it to the user to create portion of the state
*/

const setEmail = next => (convo, response) => {
	let { email } = response.meaning.parameters;
	let userToCreate = getUserToCreate(convo.getState());
	if (email && isEmail(email)) {
		userToCreate.email = email;
		convo
			.say(`Thanks`)
			.setState(setUserToCreate(userToCreate))
	} else {
		convo.say(`sorry, that doesn't seem to be  a proper email address.`);
	}
	return next();
}

/*
*	Wrong Info
*	Chain for when the information passed is wrong
*/

const wrongInfo = type => fulfillChain(
	next => (convo, response) => {
		let userToCreate = getUserToCreate(convo.getState());
		let setUserState = (user) => convo.setState(setUserToCreate(setUserState));
		if (!type || type === 'name') {
			userToCreate = {};
			setUserState(userToCreate)
		} else if (type === 'email') {
			delete userToCreate.email;
			setUserState(userToCreate)
		}
		next();
	},
	askForMissingKeyInfo
)


/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

module.exports = createDialog('newUser', dialog => {

	/*----------------------------------------------------------
	Params
	----------------------------------------------------------*/

	const FULLNAME = dialog.param('fullname').entity('sys.any');
	const SUBJECT = dialog.param('subject').entity('subject');
	const RELATIONSHIP = dialog.param('relationship').entity('relationships');
	const EMAIL = dialog.param('email').entity('sys.any');

	/*----------------------------------------------------------
	Intents
	----------------------------------------------------------*/

	/*
	*	Introduction
	*	This intent maps to a traditional introduction as though spoken in regular conversation when meeting someone. It will test
	*	for the subject, as well as relationship. The default subject is the user themselves. If a relationship is found, it will assume the subject is third person.
	*/

	dialog.registerIntent(
		dialog.intent('introduce', true)
			.params([FULLNAME, SUBJECT, RELATIONSHIP])
			.userSays(params => [
				`I'd like to introduce ${params.subject('myself')}`,
				`I'd like to introduce you too ${params.relationship('someone')}`,
				`I'd like to introduce you too ${params.subject('my')} ${params.relationship('friend')}`,
				`I'd you to learn about ${params.fullname('Joe Shatner')}`,
				`I'd you to learn about ${params.subject('my')} ${params.relationship('acquaintance')}`,
				`Hi, I'm ${params.fullname('Joe Shatner')}`,
				`Hello, I'm ${params.fullname('Xavier')}`
			])
			.fulfillWith(fulfillChain(setUserName, setConversationSubject, askForMissingKeyInfo))
	)

	/*
	*	Command
	*	This intent directly opens the dialog for creating a new user. If the user who opened the dialog is not already a user of the system, we will
	* 	ask them to confim if the user is for themself or for someone else.
	*/

	dialog.registerIntent(
		dialog.intent('command', true)
			.userSays(params => [
				`learn a new user`,	
				`add new user`,
				`add user`,
				`create a new user`,
				`setup a user`,
				`I need you to learn a new user`,
			])
			.fulfillWith((convo, response) => {
				convo
					.setContext(IS_FOR_CURRENT_USER)
					.say('Is this user for yourself?')
			})
	)

	dialog.registerIntent(
		dialog.intent.approval(IS_FOR_CURRENT_USER)
			.fulfillWith(fulfillChain(
				next => (convo) => {
					convo.setState(setSubject('self'));
					next();
				},
				askForMissingKeyInfo
			))
	)

	dialog.registerIntent(
		dialog.intent.refusal(IS_FOR_CURRENT_USER)
			.fulfillWith(fulfillChain(
				next => (convo) => {
					convo.setState(setSubject('other'));
					next();
				},
				askForMissingKeyInfo
			))
	)

	/*
	*	Get name
	*	This intent asks for the users name, it requires the ASK_FULL_NAME context to be set
	*/

	dialog.registerIntent(
		dialog.intent('set-name')
			.requires(ASK_FULL_NAME)
			.params([FULLNAME])
			.userSays(params => [params.fullname()], true)
			.fulfillWith(fulfillChain(
				setUserName,
				askForMissingKeyInfo
			))
	)


	/*
	*	Get email
	*	This intent asks for the users email, it requires the ASK_FOR_EMAIL context to be set
	*/

	dialog.registerIntent(
		dialog.intent('set-email')
			.requires(ASK_FOR_EMAIL)
			.params([EMAIL])
			.userSays(params => [params.email()], true)
			.fulfillWith(fulfillChain(
				setEmail,
				askForMissingKeyInfo
			))
	)

	/*
	*	Confirm details
	*	Confirms the users details are correct
	*/

	dialog.registerIntent(
		dialog.intent.approval(ASK_TO_CONFIRM_USER)
			.fulfillWith((convo, response) => {
				convo
					.say("Ok, saving user")
					.action('newUser', { user: getUserToCreate(convo.getState()) })
					.endDialog();
			})
	)

	dialog.registerIntent(
		dialog.intent('email-wrong')
			.requires(ASK_TO_CONFIRM_USER)
			.userSays(params => [
				'The email is wrong',
				'No, the email is wrong',
				'Email is wrong',
				'Wrong email'
			])
			.fulfillWith(wrongInfo('email'))
	)

	dialog.registerIntent(
		dialog.intent('name-wrong')
			.requires(ASK_TO_CONFIRM_USER)
			.userSays(params => [
				'The email is name',
				'No, the email is name',
				'Email is name',
				'Wrong name'
			])
			.fulfillWith(wrongInfo('name'))
	)

	dialog.registerIntent(
		dialog.intent.refusal(ASK_TO_CONFIRM_USER)
			.fulfillWith(wrongInfo())
	)

});