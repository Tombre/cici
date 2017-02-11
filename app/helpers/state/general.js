/*----------------------------------------------------------
	Subject
----------------------------------------------------------*/

/*
*	Sets the user to create in the state
*/
function setSubject(subject = 'self') {
	return { subject };
}

module.exports.setSubject = setSubject



/*
*	gets the user to create from the state
*/
function getSubject(state = {}) {
	return (state.subject || {});
}

module.exports.getSubject = getSubject