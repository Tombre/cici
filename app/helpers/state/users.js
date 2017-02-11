
/*----------------------------------------------------------
	Creating a user
----------------------------------------------------------*/

/*
*	Sets the user to create in the state
*/
function setUserToCreate(state = {}, data) {
	state.userToCreate = data;
	return state;
}

module.exports.getUserToCreate = getUserToCreate



/*
*	gets the user to create from the state
*/
function getUserToCreate(state = {}) {
	return Object.assign({}, state.userToCreate);
}

module.exports.getUserToCreate = getUserToCreate