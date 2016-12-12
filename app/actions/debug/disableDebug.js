const registerIntent = require('brain/registerAction');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = registerIntent('enableDebug', function(parameters, dispatch) {
	convo.say('disabling debug mode');
});