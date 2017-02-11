
/*----------------------------------------------------------
	Creating a user
----------------------------------------------------------*/

/*
*	Sets the user to create in the state
*/
function setUserToCreate(userToCreate) {
	return { userToCreate };
}

module.exports.setUserToCreate = setUserToCreate



/*
*	gets the user to create from the state
*/
function getUserToCreate(state = {}) {
	return (state.userToCreate || {})
}

module.exports.getUserToCreate = getUserToCreate