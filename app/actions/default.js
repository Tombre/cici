const registerIntent = require('brain/registerIntent');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = registerIntent('default', function(convo, dispatch) {

	convo.stream.read
		.observe(e => {
			let {source, fulfillment, action } = convo.state;
			if ((source === 'domains' && fulfillment) || action === 'input.unknown') {
				convo.say(fulfillment.speech);
				convo.end();
			}
		});

});