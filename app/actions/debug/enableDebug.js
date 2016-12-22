const registerIntent = require('brain/createAction');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = registerIntent('enableDebug', function(parameters, dispatch) {
	convo.say('enabling debug mode');
});