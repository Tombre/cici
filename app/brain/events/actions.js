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
function fulfillAction(intent, conversation) {

	const defaults = {
		intent: 'default',
		conversation: null
	};

	return {
		type: ACTION_FULFILL,
		payload: _.assign(defaults, { intent, conversation })
	}
}

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = {
	ACTION_FULFILL, fulfillAction
}

