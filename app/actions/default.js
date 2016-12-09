const registerIntent = require('brain/registerIntent')

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

module.exports = registerIntent('default', function(convo) {

	let {source, fulfillment, action } = convo.state;
	
	console.log(convo.subscription);

	if ((source === 'domains' && fulfillment) || action === 'input.unknown') {
		convo.say(fulfillment.speech);
	}

});