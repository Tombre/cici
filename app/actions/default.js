const registerIntent = require('brain/createAction');
const { choose } = require('helpers/response');
const { sendMessage } = require('brain/events/message');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = registerIntent('default', function(dispatch, parameters) {

	let message = parameters.message;

	const say = (text) => {
		let config = {
			text,
			adapterID: message.adapterID
		};
		dispatch(sendMessage(config));
	};

	say(choose([
		`I'm sorry. I'm having trouble understanding the question.`,
		`I think I may have misunderstood your last statement.`,
		`I'm sorry. I didn't quite grasp what you just said.`,
		`I don't think I'm qualified to answer that yet.`,
		`I'm a bit confused by that last part.`,
		`I'm not sure I follow.`,
		`I'm afraid I don't understand.`
	]));
});