const createDialog = require('brain/createDialog');
const { fulfillChain } = require('helpers/fulfillment');
const { getUserFromAdapterEvent, getUserFromEmail, getAdapterProfile, User } = require('memory/user');
const { authenticate, makeAccessToken, AccessToken } = require('memory/accessToken');
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

const askForPassphrase = next => (convo, response) => {
	let { login } = convo.getState();	
	return makeAccessToken(login.user, response.adapterID)
		.then(token => {
			convo
				.setState({ login: Object.assign(login, { tokenID: token._id }) })
				.setContext(DECLARE_PASSPHRASE)
				.say(`I've sent an access token to your email address, please paste it as the next message once you recieve it.`)
		})
		.catch(err => {
			console.log(err);
			convo.say(`sorry, an error occured while trying to authenticate you, please try again later`).endDialog();
		})
}


/*
*	Authenticate Credentials
*	Authenticated the credentials of the user
*/

const authenticateCredentials = next => (convo, response) => {
	
	const { user, passphrase, tokenID } = convo.getState().login;
	
	AccessToken.findById(tokenID)
		.then(token => {
			if (!token) {
				return Promise.reject('Sorry, your token has expired')
			}
			return authenticate(token, passphrase, response.adapterID, response.author);
		})
		.then(auth => {
			
			if (auth === false) {
				let login = convo.getState().login;
				login.passphrase = null;				
				return convo
					.setState({ login })
					.setContext(DECLARE_PASSPHRASE)
					.say(`Your passphrase is incorrect, Please try again.`)
			}

			return new Promise((resolve, reject) => {
				User.findByIdAndUpdate(
					user.id,
					{ $push: { "adapterProfiles": getAdapterProfile(response) } },
					{ upsert: true, runValidators: true },
					(err, user) => {
						if (err) return reject(err);
						resolve(user);
					}
				)
			});
				
		})
		.then(user => {
			convo
				.say(`Thankyou ${user.fullname}, you have been successfully authenticated to this channel`)
				.endDialog();
		})
		.catch(err => {
			if (typeof err === 'string') {
				convo.say(err);
			} else {
				console.log(err);
				convo.say('sorry, an error occured and I was unable to log you in. Please try again shortly');
			}
			convo.endDialog();
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
				askForPassphrase
			))
	)

	/*
	*	Set Passphrase
	*	Collects the passphrase that was sent to them from the user.
	*/

	dialog.registerIntent(
		dialog.intent('set-passphrase')
			.requires(DECLARE_PASSPHRASE)
			.params([PASSPHRASE])
			.userSays(params => [params.passphrase()], true)
			.fulfillWith(fulfillChain(
				next => (convo, response) => {
					let { passphrase } = response.meaning.parameters;
					let { login } = convo.getState();
					login.passphrase = passphrase;
					convo.setState({ login });
					next();
				},
				authenticateCredentials
			))
	)

})