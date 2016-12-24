const kefir = require('kefir');
const _ = require('lodash');
const { query, config } = require('helpers/api');
const { filterRead, filterSend } = require('helpers/streams');
const { sendMessage } = require('brain/events/message');
const { fulfillAction } = require('brain/events/actions');

/*----------------------------------------------------------
Settings
----------------------------------------------------------*/

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

/*----------------------------------------------------------
AI
----------------------------------------------------------*/

function returnObservableMeaning(convo, event) {
	let request = query(event.text, { sessionId : convo.id });
	return kefir.fromPromise(request)
		.map(e => {
			return e.result;
		});
};


/*----------------------------------------------------------
RESPONSE
----------------------------------------------------------*/

function defaultResponse(dispatch, meaning) {
	if (meaning.score === 1 && meaning.fulfillment.speech) {
		return dispatch.say(meaning.fulfillment.speech);
	}
	return dispatch.action('default')
}

function errorHandler(error) {
	console.log('ERROR', error);
}

/*----------------------------------------------------------
Conversation Object
----------------------------------------------------------*/

function Conversation(eventStream, sourceEvent, getSolutions, removeFromConversationsList) {

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
	this.cognitiveFunction = 'idle';

	// the steam of all messages within this conversation. For every message the meaning is interpereted. While this is occurring, ongoing messages are buffered
	this.stream = getFilteredStream.call(this, filterRead)
		.toProperty(() => sourceEvent)
		// manage cognitive buffer of events. This is so the system only has to interperate one message at a time
		.takeWhile(e => this.cognitiveFunction === 'idle')
		.flatMapConcat(e => {
			this.cognitiveFunction = 'recognition'
			// get meaning from event and add it to the event object
			return returnObservableMeaning(this, e)
				.map(meaning => {
					this.resolvingMeaning = false;
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

	const say = (text) => {
		eventStream.dispatch(sendMessage({
			text: text,
			adapterID: this.adapter
		}));	
	};

	const dispatchAction = (defaults, name, params) => {
		let computed = _.assign({}, defaults, params);
		eventStream.dispatch(fulfillAction(name, computed));
	};

	const setContext = (contexts) => {
		
	};

	const observeSubscription = e => {

		this.transcript.push(e);
		this.latestActivity = Date.now();

		if (e.author === 'bot') return;

		let defferFor = [Promise.resolve()];
		let solutions = getSolutions(e);
		let dispatch = { 
			say: say, 
			action: _.partial(dispatchAction, { message: e }),
			setContext: setContext 
		};

		try {
			if (solutions.length === 0) {
				defaultResponse(dispatch, e.meaning);
			} else {
				// run the solutions, passing dispatch and the meaning of the message. If they return a promise, we will wait for them
				// to complete before continuing
				defferFor = defferFor.concat(solutions.map(fn => fn(dispatch, e.meaning)));
			}
		} catch(e) {
			console.log(e);
		}

		Promise.all(defferFor)
			.then(() => {
				this.cognitiveFunction = 'idle';
			});

	};

	/*
	*	LIFECYCLE
	*/

	let subscription;

	this.begin = function() {
		if (subscription) return;
		subscription = this.stream.observe(observeSubscription, errorHandler);
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