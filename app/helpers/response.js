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
function chooseFor(value, messageMap, defaultMsg = '') {
	if (messageMap[value]) return messageMap[value];
	return defaultMsg;
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


/*
* Fulfillment Chain
* Chains HOF together so that
* fulfillChain(askforthing, next => (convo, response) => {  next() })
*/
function fulfillChain() {
	let fulfillmentArray = [...arguments];
	return function(convo, response) {
		const wrap = (wrapped) => () => wrapped(convo, response);
		let fn = () => {};
		for (var i = fulfillmentArray.length - 1; i >= 0; i--) {
			fn = wrap(fulfillmentArray[i](fn))
		}
		return fn();
	}
}

module.exports = { choose, chooseFor, higherOrderFulfill, fulfillChain };