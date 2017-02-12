
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


/*----------------------------------------------------------
	Responding User
----------------------------------------------------------*/

/*
*	gets the user to create from the state
*/

function setUser(user) {
	return { user };
}

module.exports.setUser = setUser

/*
*	gets the user to create from the state
*/

function getUser(state = {}) {
	return (state.user || {});
}

module.exports.getUser = getUser