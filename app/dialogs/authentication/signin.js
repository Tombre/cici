const createDialog = require('brain/createDialog');
const { fulfillChain } = require('helpers/fulfillment');
const { getUserFromAdapterEvent, getUserFromEmail, getAdapterProfile, User } = require('memory/user');
const { makeAdapterAccessToken } = require('memory/accessToken');
const isEmail = require('validator/lib/isEmail');

/*----------------------------------------------------------
	Contexts
----------------------------------------------------------*/

const DECLARE_EMAIL = 'DECLARE_EMAIL'
const DECLARE_PASSPHRASE = 'DECLARE_PASSPHRASE'

/*----------------------------------------------------------
	Fulfillment
----------------------------------------------------------*/

/*
*	Ask for email
*	Asks for the users emailaddress
*/

const askForEmail = next => (convo, response) => {
	convo
		.setContext(DECLARE_EMAIL)
		.say('What is your email address?')
}


/*
*	Ask for passphrase
*	Creates an access token that is sent to the users email address, then asks for it.
*/

const sendToken = next => (convo, response) => {
	let { login } = convo.getState();	
	let {adapterID, author} = response;
	return makeAdapterAccessToken(login.user, adapterID, author)
		.then(token => {
			convo
				.say(`I've sent an access token link to your email address. When you recieve it, click on the authenticaion link to connect your account.`)
				.endDialog();
		})
		.catch(err => {
			console.log(err);
			convo.say(`sorry, an error occured while trying to authenticate you, please try again later`).endDialog();
		})
}


/*----------------------------------------------------------
	Dialog
----------------------------------------------------------*/

module.exports = createDialog('sign-in', dialog => {

	/*----------------------------------------------------------
	Params
	----------------------------------------------------------*/

	const EMAIL = dialog.param('email').entity('sys.any');
	const EMAIL_ORIGINAL = dialog.param('emailOrigional').setValue('\$email.original');
	const PASSPHRASE = dialog.param('passphrase').entity('sys.any');

	/*----------------------------------------------------------
	Intents
	----------------------------------------------------------*/

	/*
	* 	Start Intent
	*	Kicks the signing in process off
	*/

	dialog.registerIntent(
		dialog.intent('start', true)
			.userSays(params => [
				`sign me in`,
				`Can I sign in`,
				`Authenticate me`,
				`Log me in`,
				`authenticate`
			])
			.fulfillWith(fulfillChain(
				next => (convo, response) => {
					getUserFromAdapterEvent(response)
						.then(user => {
							if (user) {
								let { lastName, givenName, email} = user;
								return convo.say(`You are already logged in as ${lastName ? (givenName + ' ' + lastName) : givenName}: ${email}`).endDialog();
							}
							next();
						});
				},
				askForEmail
			))
	)

	/*
	* 	Select email
	*	The user inputs their email. If their email is not available, then too bad - we can't support email changing funcs yet. If the user doesn't exist,
	*	then they will need to create a new user.
	*/

	dialog.registerIntent(
		dialog.intent('set-email')
			.requires(DECLARE_EMAIL)
			.params([EMAIL, EMAIL_ORIGINAL])
			.userSays(params => [params.email()], true)
			.fulfillWith(fulfillChain(
				next => (convo, response) => {
					
					let { emailOrigional } = response.meaning.parameters;
					let email = emailOrigional;

					if (!email || !isEmail(email)) {
						return convo
							.setContext(DECLARE_EMAIL)
							.say(`sorry, that doesn't seem to be  a proper email address. Could you try again?`);
					}

					// set the state
					getUserFromEmail(email)
						.then(user => {

							if (!user) {
								return convo
									.say(`Sorry, I don't know anyone by that email address`)
									.endDialog();
							}

							convo.setState({ login: { user } });
							return next();
						})
					
				},
				sendToken
			))
	)

})