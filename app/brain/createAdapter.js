const Kefir = require('kefir');
const { recievedMessage,  sendMessage } = require('brain/events/message');
const { filterRead, filterSend } = require('helpers/streams');

/*----------------------------------------------------------
Register Adapter
----------------------------------------------------------*/

module.exports = function(id, adapter) {	
	
	return function(eventStream, config) {

		const readStream = filterRead(eventStream).filter(e => (e.adapterID === id));
		const sayStream = filterSend(eventStream)
			.map(e => e.payload)
			.filter(e => (e.adapterID === id));
		
		// push a message from the adapter to the message stream
		function pushMessageEvent(event, trigger) {
			event.adapterID = id;
			event.triggerConversation = trigger || false;
			eventStream.plug(Kefir.constant(recievedMessage(event)));
		}

		// push a speaking event to the adapters say steam
		function pushSpeakEvent(event) {
			event.adapterID = id;
			eventStream.plug(Kefir.constant(sendMessage(event)));
		}

		function subscribeToSpeakEvent(fn) {
			let subscription = sayStream.observe(fn);
			return subscription.unsubscribe;
		}

		// pass fn to push messages, and another to subscribe to the speaking event
		adapter(pushMessageEvent,  subscribeToSpeakEvent);

		return {  id, pushSpeakEvent };

	};
}