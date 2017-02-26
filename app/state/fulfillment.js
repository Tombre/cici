/*----------------------------------------------------------
	Fulfillment
----------------------------------------------------------*/

/*
*	Sets the user to create in the state
*/
function setToFulfill(toFulfill) {
	return { toFulfill };
}

module.exports.setToFulfill = setToFulfill



/*
*	gets the user to create from the state
*/
function getToFulfill(state = {}) {
	return (state.toFulfill || []);
}

module.exports.getToFulfill = getToFulfill