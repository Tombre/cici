const registerIntent = require('brain/registerAction');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = registerIntent('default', function(parameters, dispatch) {
	console.log('default action run!');
});