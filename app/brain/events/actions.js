const _ = require('lodash');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

/*----------------------------------------------------------
Events
----------------------------------------------------------*/

/*
*	Recieve a message from an adapter.
*/
const ACTION_FULFILL = 'ACTION_FULFILL';
function fulfillAction(actionName, parameters) {

	const defaults = {
		actionName: 'default',
		parameters: {}
	};

	return {
		type: ACTION_FULFILL,
		payload: _.assign(defaults, { actionName, parameters })
	}
}

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = {
	ACTION_FULFILL, fulfillAction
}

