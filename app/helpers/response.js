const _ = require('lodash');

function choose(messages) {
	return messages[_.random(0, (messages.length -1))];
}

function chooseFor(value, messageMap) {
	return map[value];
}

function higherOrderFulfill(fn) {
	return function(cb) {
		cb = cb || (dispatch) => dispatch;
		return function(dispatch, response, state) {
			return cb(dispatch._bindMethodsTo(fn(dispatch, response, state)), response, state)
		}
	}
}

module.exports = { choose, chooseFor, higherOrderFulfill };