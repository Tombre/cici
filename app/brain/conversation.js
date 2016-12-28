const kefir = require('kefir');
const _ = require('lodash');
const uuid = require('uuid/v4');
const { query, config, POST, GET, DELETE } = require('helpers/api');
const { filterRead, filterSend } = require('helpers/streams');
const { sendMessage } = require('brain/events/message');
const { fulfillAction } = require('brain/events/actions');
const { choose } = require('helpers/response');

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

function getGeneratorFromFnArray(arr, args) {
	function* iter() {
		for (var i = 0; i < arr.length; i++) {
			let index = i;
			yield (fn => arr[index].apply(null, args));
		}
	}
	let dfferable = Promise.resolve();
	for (let fn of iter()) {
		dfferable = dfferable.then(fn);
	}
	return dfferable;
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
	return dispatch.say(choose([
		`I'm sorry. I'm having trouble understanding the question.`,
		`I think I may have misunderstood your last statement.`,
		`I'm sorry. I didn't quite grasp what you just said.`,
		`I don't think I'm qualified to answer that yet.`,
		`I'm a bit confused by that last part.`,
		`I'm not sure I follow.`,
		`I'm afraid I don't understand.`
	]));
}

function errorHandler(error) {
	console.log('ERROR', error);
}

/*----------------------------------------------------------
Conversation Object
----------------------------------------------------------*/

function Conversation(eventStream, sourceEvent, getIntent, removeFromConversationsList) {

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

	this.id = uuid();
	this.participant = sourceEvent.author;
	this.adapter = sourceEvent.adapterID;
	
	this.transcript = [];
	this.status = 'active';
	this.latestActivity = Date.now();	
	this.cognitiveFunction = 'idle';

	// the steam of all messages within this conversation. For every message the meaning is interpereted. While this is occurring, ongoing messages are ignored
	this.messageStream = getFilteredStream.call(this, filterRead)
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


	/*
	*	EFFECTS
	*/

	const say = (text) => {
		eventStream.dispatch(sendMessage({
			text: text,
			adapterID: this.adapter
		}));
		return Promise.resolve();
	};

	const dispatchAction = (defaults, name, params) => {
		let computed = _.assign({}, defaults, params);
		eventStream.dispatch(fulfillAction(name, computed));
		return Promise.resolve();
	};

	const setContext = (context, lifespan) => {
		let contexts = _.isArray(context) ? context : [context];
		let contextRequests = contexts.map(context => POST('contexts', { sessionId: this.id }, { 
			name: context, 
			lifespan: lifespan || 1
		}));
		return Promise.all(contextRequests);
	};

	const clearContext = (context) => {
		let contexts = _.isArray(context) ? context : [context];
		let contextRequests = contexts.map(context => DELETE(`contexts/${context}`, { sessionId: this.id }));
		return Promise.all(contextRequests)
	};

	const endDialog = () => {
		let removePromise = DELETE(`contexts`, { sessionId: this.id });
		return removePromise.then(() => this.end());
	};

	/*
	*	SUBSCRIPTIONS
	*/

	const observeSubscription = e => {

		this.transcript.push(e);
		this.latestActivity = Date.now();

		if (e.author === 'bot') return;

		let intent = getIntent(e);		
		let dispatch = { 
			say, 
			setContext,
			endDialog,
			action: _.partial(dispatchAction, { message: e }),
		};

		this.cognitiveFunction = 'evaluation';

		// run the solutions, passing dispatch and the meaning of the message. If they return a promise, we will wait for them
		// to complete before continuing
		try {
			if (!intent || intent.solutions.length === 0) {
				defaultResponse(dispatch, e.meaning);
				this.cognitiveFunction = 'idle'
			} else {
				let queue = getGeneratorFromFnArray(intent.solutions, [dispatch, e.meaning]);
				queue.then(e => this.cognitiveFunction = 'idle');
			}
		} catch(e) {
			console.log(e);
		}

	};

	/*
	*	LIFECYCLE
	*/

	let subscriptions = [];

	this.begin = function() {
		if (subscriptions.length) return;
		subscriptions.push(this.messageStream.observe(observeSubscription, errorHandler));
	};

	this.end = function() {
		if (subscriptions.length) subscriptions.forEach(s => s.unsubscribe());
		subscriptions = [];
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