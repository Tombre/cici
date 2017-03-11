const createAction = require('brain/createAction');
const { choose } = require('helpers/response');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('default', function(dispatch, def) {
	dispatch.say(choose([
		`Sorry, I am unable to fulfil your request`,
		`Sorry, I have no actions associated with this outcome`,
	]));
});