const _ = require('lodash');
const { getUserFromNameInResponse } = require('./_helpers');
const { User, profileTypes, getUserFromAdapterEvent } = require('memory/user');

/*----------------------------------------------------------
	Helper
----------------------------------------------------------*/

function passWithNewState(cb, dispatch, response) {
	return (newState => cb(dispatch, response, newState))
}

/*----------------------------------------------------------
	Helper Responses
----------------------------------------------------------*/



/*----------------------------------------------------------
	Higher order fulfillments
----------------------------------------------------------*/


/*
*	Require user for fulfillment
*	Pass to an intent's fulfillment so it requires a user to be in the state of the conversation. If no user, will map to creating one
*/
function requireUserForFulfillment(cb, userMissingMessage) {
	return (dispatch, response, state) => {
		if (!state.user) {
			return getUserFromAdapterEvent(response)
				.then(user => {
					if (user) {
						return dispatch.setState({ user }).then(passWithNewState(cb, dispatch, response))
					}
					return dispatch
						.say(userMissingMessage || `Sorry, I cant complete your request unless I know a bit more about you...`));
						.mapToIntent('learnNewUser/start')
				})
		}
		return cb(dispatch, response, state);
	}
}

module.exports.requireUserForFulfillment = requireUserForFulfillment;


/*
*	Get user from adapter event
*	Attempts to get the user model from an adapter event, and set it on the state of the conversation
*/
function getUserFromAdapterEvent(cb) {
	return (dispatch, response, state) => {
		return User.getUserFromAdapterEvent(response)
			.then(user => {
				if (user) {
					return dispatch.setState({ user }).then(passWithNewState(cb, dispatch, response))
				}
			})
	}
}

module.exports.getUserFromAdapterEvent = getUserFromAdapterEvent;
