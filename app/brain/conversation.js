const kefir = require('kefir');
const _ = require('lodash');
const apiai = require('apiai');
const { filterRead, filterSend } = require('helpers/streams');
const { sendMessage } = require('brain/events/message');
const { fulfillAction } = require('brain/events/actions');

/*----------------------------------------------------------
Settings
----------------------------------------------------------*/

const ai = apiai("31a2f7230a7b4852a11bcada3ad287a3");
const convoTimeout =  1000 * 60 * 4;

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function doesConvoMatchEvent(convo, event) {
	return (
		(convo.status === 'active') &&
		(convo.participant === event.author || event.author === 'bot') &&
		(convo.latestActivity <= event.timestamp) &&
		((event.timestamp - convo.latestActivity) < convoTimeout) &&
		(convo.adapter === event.adapterID) &&
		true
	);
}

function createMessageCallback(messageStream, cb) {
	return messageStream.take(1)
}

function setStateFromAI(state, meaning) {
	return _.assign({}, state, _.pick(meaning, Object.keys(state)));
}

/*----------------------------------------------------------
AI
----------------------------------------------------------*/

function returnObservableMeaning(convo, event) {
	return kefir.stream(emitter => {
		let options = {
			sessionId: convo.id
		};
		const request = ai.textRequest(event.text, options);
		request.on('response', response => {
			emitter.emit(response.result)
			emitter.end();
		});
		request.on('error', response => {
			emitter.error(response);
			emitter.end();
		});
		request.end();
	});
};

/*----------------------------------------------------------
Conversation Object
----------------------------------------------------------*/

function Conversation(eventStream, sourceEvent, removeFromConversationsList) {

	/*
	*	HELPER
	*/

	function getFilteredStream(filter) {
		return filter(eventStream)
			.map(e => e.payload)
			.filter(e => doesConvoMatchEvent(this, e));
	}

	/*
	*	INITIAL SETUP 
	*/

	this.id = _.uniqueId('conversation_');
	this.participant = sourceEvent.author;
	this.adapter = sourceEvent.adapterID;
	
	this.transcript = [];
	this.status = 'active';
	this.latestActivity = Date.now();

	this.state = {
		source: null,
		resolvedQuery: null,
		action: null,
		parameters: {},
		contexts: [],
		fulfillment: null,
		score: 0
	};

	// the steam of all messages within this conversation
	this.stream = getFilteredStream.call(this, filterRead)
		.toProperty(() => sourceEvent)
		.flatMapConcat(e => {
			// get meaning from event and add it to the event object
			return returnObservableMeaning(this, e)
				.map(meaning => {
					e.meaning = meaning;
					return e;
				});
		})
		.merge(getFilteredStream.call(this, filterSend))
		.takeWhile(e => this.status === 'active')
		.toProperty();

	this.stream.read = this.stream.filter(e => e.author !== 'bot');
	this.stream.say = this.stream.filter(e => e.author === 'bot');


	/*
	*	EFFECTS
	*/

	this.mapToIntent = function(intent) {
		eventStream.dispatch(fulfillAction(intent, this.id));
	};

	this.say = function(text) {
		eventStream.dispatch(sendMessage({
			text: text,
			adapterID: this.adapter
		}));	
	};

	/*
	*	LIFECYCLE
	*/

	let subscription;

	this.begin = function() {
		
		if (subscription) return;

		subscription = this.stream.observe(e => {
				this.transcript.push(e);
				this.latestActivity = Date.now();
				if (e.meaning) {
					this.state = setStateFromAI(this.state, e.meaning);
				}
			});

		this.stream.read
			.take(1)
			.observe(e => this.mapToIntent(e.meaning.action));

	};

	this.end = function() {
		if (subscription) subscription.unsubscribe();
		subscription = null;
		this.status = 'ended';
		removeFromConversationsList(this);
	};

	/*
	*	START
	*/

	this.begin();

}

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = {
	doesConvoMatchEvent,
	Conversation
}