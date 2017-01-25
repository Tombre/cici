const _ = require('lodash');

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
function chooseFor(value, messageMap) {
	return map[value];
}

/*
* Higher Order Fulfill
* Creates a HOF function which accecpts a fulfillment callback. The fn passed should return an array of [dispatch, response, state].
*/
function higherOrderFulfill(fn) {
	return function(cb) {
		cb = cb || (dispatch) => dispatch;
		return function(dispatch, response, state) {
			return cb(...fn(dispatch, response, state))
		}
	}
}

module.exports = { choose, chooseFor, higherOrderFulfill };