const createAction = require('brain/createAction');
const { debugToggle } = require('brain/events/debug');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('debugMode', function(dispatch, params) {
	dispatch(debugToggle(params.enabled, params.author));
});