const kefir = require('kefir');
const _ = require('lodash');
const uuid = require('uuid/v4');
const prettyjson = require('prettyjson');
const { query, DELETE } = require('helpers/api');
const { filterRead, filterSend, filterbyEventType } = require('helpers/streams');
const { sendMessage } = require('brain/events/message');
const { fulfillAction } = require('brain/events/actions');
const { choose } = require('helpers/response');
const { DEBUG_TOGGLE, DEBUG_EVENT, debugEvent } = require('brain/events/debug');

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
		(_.isEqual(convo.source, event.source)) &&
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
	// request the meaning and attach to observavle events. We reset context every time here, so we can avoid making additional requests and introducing
	// asyncronous requests
	let request = query(event.text, convo.contexts, { sessionId : convo.id, resetContexts: true });
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

	/*----------------------------------------------------------
	helper
	----------------------------------------------------------*/

	const log = (description, event) => {
		console.log(description, event);
		eventStream.dispatch(debugEvent({ description, event }, this.participant));
	}

	function getFilteredStream(filter) {
		return filter(eventStream)
			.map(e => e.payload)
			.filter(e => doesConvoMatchEvent(this, e))
	}

	/*----------------------------------------------------------
	Setup
	----------------------------------------------------------*/

	this.id = uuid();
	this.participant = sourceEvent.author;
	this.adapter = sourceEvent.adapterID;
	this.source = sourceEvent.source || {};

	this.transcript = [];
	this.contexts = [];
	this.status = 'active';
	this.latestActivity = Date.now();	
	this.cognitiveFunction = 'idle';
	this.state = {};

	// the steam of all messages within this conversation. For every message the meaning is interpereted. While this is occurring, ongoing messages are ignored
	this.messageStream = getFilteredStream.call(this, filterRead)
		.toProperty(() => sourceEvent)
		.map(e => _.assign(e, { conversationID : this.id }))
		// manage cognitive buffer of events. This is so the system only has to interperate one message at a time
		.filter(e => this.cognitiveFunction === 'idle')
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


	/*----------------------------------------------------------
	Effects
	----------------------------------------------------------*/

	const say = (text) => {
		eventStream.dispatch(sendMessage({
			text: text,
			adapterID: this.adapter,
			source: this.source
		}));
	};

	const dispatchAction = (defaults, name, params) => {
		log(`Dispatching action`, { name, params });
		let computed = _.assign({}, defaults, params);
		eventStream.dispatch(fulfillAction(name, computed));
	};

	// sets an array of contexts to the conversation. Does not add duplicates
	const setContext = (context, prime = false) => {
		log(`Setting context`, { context, prime });
		let contexts = _.isArray(context) ? context : [context];
		contexts = contexts.map(c => {
			if (_.isObject(c)) {
				return _.assign({}, { lifespan: 1, prime }, c);
			}
			return {
				name: c,
				lifespan: 1,
				prime
			}
		});
		this.contexts = _.unionBy(this.contexts, contexts, 'name');
		return this.contexts;
	};

	// Clear contexts. Clears all but the prime context if none are passed. To clear the prime you must clear manually
	const clearContext = (context) => {
		log('Clearing context', { context });
		if (_.isString(context) || _.isArray(context)) {
			let contexts = _.isArray(context) ? context : [context];
			this.contexts = _.without(this.contexts, ...contexts);	
		} else {
			// if the context is true, we want to clear all contexts, otherwise clear all except the prime context
			if (context === true) {
				this.contexts = [];
			} else {
				this.contexts = _.filter(this.contexts, c => c.prime === true);
			}
		}
		return this.contexts;
	};

	const endDialog = () => {
		log('Ending dialog');
		clearState();
		this.end();
	};

	const setState = (state) => {
		if (!_.isPlainObject(state)) throw new Error('setState must be passed a plain object representing a state object');
		log(`setting conversation state`, { prev: this.state, new: state });
		this.state = _.assign({}, this.state, state);
		return getState();
	}

	const getState = () => {
		return _.cloneDeep(this.state);
	}

	const clearState = () => {
		log(`clearing conversation state`);
		this.state = {};
		return this.state;
	}

	const mapToIntent = (intentName) => {
		log(`mapping to intent`, { intentName });
		clearContext(true);
		
		let intent = getIntent(intentName);
		let event = _.findLast(this.transcript, e => (e.author !== 'bot'));

		evaluateIntentWithEvent(intent, event);
	}


	/*----------------------------------------------------------
	Subscriptions
	----------------------------------------------------------*/

	/*
	*	Evaluate Intent
	*	Takes an intent and evaluates it's solutions
	*/
	const evaluateIntentWithEvent = (intent, e) => {

		let dispatch = { say, log, setContext, clearContext, endDialog, setState, getState, clearState, mapToIntent,
			action: _.partial(dispatchAction, { message: e })
		};

		this.cognitiveFunction = 'evaluation';

		let catchError = (e => {
			say(`Sorry, an error occured and I am unable to complete your request`);
			log(`Failed to evaluate solutions`,  { intent, message: e });
			console.log(e);
		});

		// run the solutions, passing dispatch and the meaning of the message. If they return a promise, we will wait for them
		// to complete before continuing
		try {

			if (!intent || intent.solutions.length === 0) {
				log(`No matching intent, running default response`);
				defaultResponse(dispatch, e.meaning, this.state);

			} else {

				log(`Intent interpretation and evaluation`,  { 
					name: intent.name,
					initialIntent: intent.initialIntent,
					dialog: intent.dialog
				});

				// run each solution and pass the dispatch object, the event and the current state (shallow coppied)
				intent.solutions.forEach(fn => fn(dispatch, e));

			}
		} catch(e) {
			catchError(e);
		}

		this.cognitiveFunction = 'idle'

	}

	// handles the evaluation of messages that are passed through the conversation object. This subscription evaluates the solutions of a matched
	// dialog and runs associated functions.
	const messageSubscription = () => this.messageStream.observe((e) => {

		this.transcript.push(e);
		this.latestActivity = Date.now();
		
		if (e.author === 'bot') return;
		
		log(`Message recieved`, e);

		// clear the context so that it's not re-sent with the next query
		clearContext();

		let intent = getIntent(e.meaning.action);	
		return evaluateIntentWithEvent(intent, e);

	}, errorHandler);

	// subscribes to a debug handler this coversation. This will write logs into the conversation if those logs match the current conversation
	const debugSubscription = () => {
		
		let convoFilter = (e => (e && e.author && e.author === this.participant)); 
		
		return filterbyEventType(DEBUG_TOGGLE, eventStream)
			.filter(convoFilter)
			.flatMapLatest(e => {
				if (e.payload.toggle === true) return filterbyEventType(DEBUG_EVENT, eventStream);
				return kefir.constant(false);
			})
			.filter(convoFilter)
			.takeWhile(e => this.status === 'active')
			.observe(e => say('\n' + prettyjson.render(e.payload.contents)))
	};

	/*----------------------------------------------------------
	Lifecycle
	----------------------------------------------------------*/

	let subscriptions = [];

	this.begin = function() {
		if (subscriptions.length) return;
		subscriptions.concat([
			messageSubscription(),
			debugSubscription()
		]);
		log(`conversation begun`, { id: this.id });
	};

	this.end = function() {
		log(`conversation ending`, { id: this.id });
		if (subscriptions.length) subscriptions.forEach(s => s.unsubscribe());
		subscriptions = [];
		this.status = 'ended';
		removeFromConversationsList(this);
	};

	/*----------------------------------------------------------
	Start
	----------------------------------------------------------*/

	this.begin();

}

/*----------------------------------------------------------
Exports
----------------------------------------------------------*/

module.exports = {
	doesConvoMatchEvent,
	Conversation
}