const _ = require('lodash');
const { MESSAGE_RECEIVE, MESSAGE_SEND } = require('brain/events/message');

function filterbyEventType(types, stream) {
	types = _.isArray(types) ? types : [types]
	return stream.filter(e => types.indexOf(e.type) >= 0);
}

function filterRead(stream) {
	return filterbyEventType(MESSAGE_RECEIVE, stream);
}

function filterSend(stream) {
	return filterbyEventType(MESSAGE_SEND, stream);	
}

function filterReadAndSend(stream) {
	return filterbyEventType([MESSAGE_RECEIVE, MESSAGE_SEND], stream);	
}

module.exports = { filterbyEventType, filterRead, filterSend };