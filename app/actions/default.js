const createAction = require('brain/createAction');
const { choose } = require('helpers/response');
const { sendMessage } = require('brain/events/message');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = createAction('default', function(dispatch, parameters) {

	let message = parameters.message;

	const say = (text) => {
		let config = {
			text,
			adapterID: message.adapterID
		};
		dispatch(sendMessage(config));
	};

	say(choose([
		`Sorry, I am unable to fulfil your request`,
		`Sorry, I have no actions associated with this outcome`,
	]));
});