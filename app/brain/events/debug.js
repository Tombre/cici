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
const DEBUG_ENABLE = 'DEBUG_ENABLE';
function enableDebugging() {
	return {
		type: DEBUG_ENABLE,
		payload: {}
	}
}

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = {
	DEBUG_ENABLE, enableDebugging
}

