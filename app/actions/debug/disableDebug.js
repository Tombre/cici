const createAction = require('brain/createAction');
const { enableDebugging } = require('brain/events/debug');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('enableDebug', function(parameters, dispatch) {
	dispatch(enableDebugging());
});