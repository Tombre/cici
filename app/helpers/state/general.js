/*----------------------------------------------------------
	Subject
----------------------------------------------------------*/

/*
*	Sets the user to create in the state
*/
function setSubject(state = {}, subject = 'self') {
	state.subject = subject;
	return state;
}

module.exports.setSubject = setSubject



/*
*	gets the user to create from the state
*/
function getSubject(state = {}) {
	return Object.assign({}, state.subject);
}

module.exports.getSubject = getSubject