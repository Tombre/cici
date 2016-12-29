const createAction = require('brain/createAction');
const { choose } = require('helpers/response');
const { sendMessage } = require('brain/events/message');
const { Users } = require('memory');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('saveUser', function(dispatch, params) {

	let user = params.user;
	console.log('creating', params.user);

	
});