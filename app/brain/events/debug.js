const _ = require('lodash');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

/*----------------------------------------------------------
Events
----------------------------------------------------------*/

const DEBUG_TOGGLE = 'DEBUG_TOGGLE';
function debugToggle(toggle, conversationID) {
	return {
		type: DEBUG_TOGGLE,
		conversationID,
		payload: { toggle }
	}
}

const DEBUG_EVENT = 'DEBUG_EVENT';
function debugEvent(contents, conversationID) {
	return {
		type: DEBUG_EVENT,
		conversationID,
		payload: {
			contents
		}
	}
}

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = {
	DEBUG_TOGGLE,
	debugToggle,
	DEBUG_EVENT,
	debugEvent,
}

