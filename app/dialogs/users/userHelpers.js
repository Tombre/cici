const _ = require('lodash');
const { User, getUsersFromAdapterEvent, getUserFromEmail } = require('memory/user');
const { setUser, getUser } = require('state/users');
const { fulfillChain } = require('helpers/fulfillment');
const { chooseFor } = require('helpers/response');
const { setSubject, getSubject } = require('state/general');

/*----------------------------------------------------------
	Helper
----------------------------------------------------------*/

// gets the subject matter from the reponse
function getSubjectResponse(convo) {
	let subject = getSubject(convo.getState());
	return chooseFor(subject, { "self": "your", "other": "the user's" }, 'your');
}

module.exports.getSubjectResponse = getSubjectResponse;


/*----------------------------------------------------------
	Intent Factories
----------------------------------------------------------*/
	

/*----------------------------------------------------------
	Fulfillments
----------------------------------------------------------*/


/*
*	Require user for fulfillment
*	Pass to an intent's fulfillment so it requires a user to be in the state of the conversation. If no user, will map to creating one
*/

const requireUserForFulfillment = next => (convo, response) => {
	getUsersFromAdapterEvent(response)
		.then(user => {
			if (!user) {
				return convo
					.say('sorry, you need to be a registered user to do this.')
					.mapToIntent('newUser/should-create-new-user-self');
			}
			next();
		})
}

module.exports.requireUserForFulfillment = requireUserForFulfillment;


/*
*	Update user from state
*	Updates the user from the sate's toSet attr
*/

const setUserFromState = next => (convo, response) => {
	let { user, toSet } = convo.getState();
	User.findById(user.id)
		.then(user => {
			Object.assign(user, toSet);
			return user.save();
		})
		.then(user => {
			convo.setState(Object.assign({}, setUser(user), { toSet: null }));
			next();
		})
		.catch(err => {
			console.log(err)
			convo.say(`Sorry an error occured, I cannot update the user at this time`).endDialog();
		})
}

module.exports.setUserFromState = setUserFromState;
