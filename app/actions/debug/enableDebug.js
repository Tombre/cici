const registerIntent = require('brain/registerIntent');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = registerIntent('enableDebug', function(convo, dispatch) {
	convo.say('enabling debug mode');
});