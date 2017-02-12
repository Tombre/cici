const _ = require('lodash');
const { User, getUsersFromAdapterEvent, getUsersFromNameInResponse } = require('memory/user');
const { setUser, getUser } = require('helpers/state/users');

/*----------------------------------------------------------
	Helper
----------------------------------------------------------*/


/*----------------------------------------------------------
	Helper Responses
----------------------------------------------------------*/



/*----------------------------------------------------------
	Higher Order Fulfillments
----------------------------------------------------------*/


/*
*	Require user for fulfillment
*	Pass to an intent's fulfillment so it requires a user to be in the state of the conversation. If no user, will map to creating one
*/

const getWhichUserFromName = next => (convo, response) => {
	getUsersFromNameInResponse(response)
		.then(users => {
			if (users.length === 1) {
				convo.say(`Is this you? ${users[0].givenName} ${users[0].lastName}`)
			}
			let names = [...users].map((user, i) => `${i}: ${user.givenName} ${user.lastName}`).join(`\n    `);
			convo.say(`There are a couple of users by the same name. Which one are you? \n${names}`)
		})
}


/*
*	Require user for fulfillment
*	Pass to an intent's fulfillment so it requires a user to be in the state of the conversation. If no user, will map to creating one
*/

const requireUserForFulfillment = next => (convo, response) => {

}

