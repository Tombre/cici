const registerIntent = require('brain/registerAction');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = registerIntent('enableDebug', function(parameters, dispatch) {
	convo.say('enabling debug mode');
});