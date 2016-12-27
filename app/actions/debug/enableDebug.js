const createAction = require('brain/createAction');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('enableDebug', function(parameters, dispatch) {
	convo.say('enabling debug mode');
});