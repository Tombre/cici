const registerIntent = require('brain/createAction');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = registerIntent('default', function(parameters, dispatch) {
	console.log('default action run!');
});