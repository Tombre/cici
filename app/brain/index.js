const kefir = require('kefir');
const _ = require('lodash');
const { Conversation, doesConvoMatchEvent } = require('./conversation');
const { filterbyEventType } = require('helpers/streams');

const { MESSAGE_RECEIVE, MESSAGE_SEND } = require('brain/events/message');
const { ACTION_FULFILL } = require('brain/events/actions');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function generateEventStream() {
	let pool = kefir.pool();
	pool.dispatch = (e) => pool.plug(kefir.constant(e));
	return pool;
}

function removeConversation(conversations, convo) {
	return _.without(conversations, [convo]);
}

function getIntent(intents, event) {
	let action = event.meaning.action;
	if (intents[action]) {
		return intents[action].definition;
	};
}

/*----------------------------------------------------------
Brain
----------------------------------------------------------*/

module.exports = function(adapters, actions, dialogs, entities) {

	const config = {};
	const eventStream = generateEventStream();

	/*----------------------------------------------------------
	setup
	----------------------------------------------------------*/

	adapters = _.mapValues(adapters, adapter => adapter(eventStream, config));
	actions = _.mapValues(actions, action => action(config));
	dialogs = _.mapValues(dialogs, dialog => dialog(config));
	entities = _.mapValues(entities, entity => entity(config));

	const intents = _.reduce(dialogs, (accum, dialog) => {
		return _.assign({}, accum, dialog.intents);
	}, {});

	/*----------------------------------------------------------
	Conversations
	----------------------------------------------------------*/

	const conversations = [];

	/*
	*	START NEW CONVERSATIONS
	*/

	filterbyEventType(MESSAGE_RECEIVE, eventStream)
		.map(e => e.payload)
		.observe(e => {
			let indexOfConvo = _.findIndex(conversations, convo => doesConvoMatchEvent(convo, e));
			if (indexOfConvo === -1 && e.triggerConversation === true) {
				let newConvo = new Conversation(eventStream, e, getIntent.bind(null, intents), removeConversation.bind(null, conversations));
				conversations.push(newConvo);
			}
		});

	/*----------------------------------------------------------
	Action Fulfillment
	----------------------------------------------------------*/

	// fulfills an action by running it's associated function.

	filterbyEventType(ACTION_FULFILL, eventStream)
		.map(e => e.payload)
		.observe(e => {
			let action = actions[e.actionName] || actions['default'];
			action.fn(eventStream.dispatch, e.parameters);
		});

}