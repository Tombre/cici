const _ = require('lodash');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

/*----------------------------------------------------------
Events
----------------------------------------------------------*/

const DEBUG_TOGGLE = 'DEBUG_TOGGLE';
function debugToggle(toggle, author) {
	return {
		type: DEBUG_TOGGLE,
		author,
		payload: { toggle }
	}
}

const DEBUG_EVENT = 'DEBUG_EVENT';
function debugEvent(contents, author) {
	return {
		type: DEBUG_EVENT,
		author,
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

