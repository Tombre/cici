const _ = require('lodash');

/*----------------------------------------------------------
Functions
----------------------------------------------------------*/

/*
* Choose
* Chooses a message at random from an array of messages
*/
function choose(messages) {
	return messages[_.random(0, (messages.length -1))];
}


/*
* Choose For
* Simple helper function to choose a value from a message map
*/
function chooseFor(value, messageMap, default = '') {
	if (messageMap[value]) return messageMap[value];
	return default;
}

/*
* Higher Order Fulfill
* Creates a HOF function which accecpts a fulfillment callback. The fn passed should return an array of [dispatch, response, state].
*/
function higherOrderFulfill(fnAcceptingFulfillementCb) {
	return function(fulfillmentCb) {
		fulfillmentCb = fulfillmentCb || (() => {});
		return fnAcceptingFulfillementCb(fulfillmentCb)
	}
}

module.exports = { choose, chooseFor, higherOrderFulfill };