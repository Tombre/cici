const _ = require('lodash');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function normalizeAdapterEvent(adapterName, event) {}

/*----------------------------------------------------------
Events
----------------------------------------------------------*/

/*
*	Recieve a message from an adapter.
*/
const MESSAGE_RECEIVE = 'MESSAGE_RECEIVE';
function recievedMessage(config) {

	if (!_.isPlainObject(config)) throw new Error('config for MESSAGE_RECEIVE must be an object');

	const defaults = {
		text: '',
		author: 1, 
		timestamp: Date.now(),
		adapterEvent: null,
		adapterID: null
	};

	return {
		type: MESSAGE_RECEIVE,
		payload: _.assign(defaults, config)
	}
}

/*
*	Recieve a message from an adapter.
*/
const MESSAGE_SEND = 'MESSAGE_SEND';
function sendMessage(config) {

	if (!_.isPlainObject(config)) throw new Error('config for MESSAGE_SEND must be an object');

	const defaults = {
		text: '',
		timestamp: Date.now(),
		adapterID: null,
		author: 'bot'
	};

	return {
		type: MESSAGE_SEND,
		payload: _.assign(defaults, config)
	}
}

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = {
	MESSAGE_SEND, sendMessage,
	MESSAGE_RECEIVE, recievedMessage,
}

