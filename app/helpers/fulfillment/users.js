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
