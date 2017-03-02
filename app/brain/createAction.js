const { sendMessage } = require('brain/events/message');

/*----------------------------------------------------------
Helpers
----------------------------------------------------------*/

/*----------------------------------------------------------
Action result
----------------------------------------------------------*/

function makeActionResult(callback) {
	return function(dispatchEvent, def) {

		const dispatch = (...args) => dispatchEvent(...args);
		
		dispatch.say = (text) => {
			let { adapter, source } = def.conversation;
			let config = { text, adapterID: adapter, source };
			dispatchEvent(sendMessage(config));
		};

		return callback(dispatch, def);

	}
}

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = function(id, callback) {
	return function(config) {
		return { id, fn: makeActionResult(callback) };
	};
}