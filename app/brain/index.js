const kefir = require('kefir');
const _ = require('lodash');
const { Conversation, doesConvoMatchEvent } = require('./conversation');
const { filterbyEventType } = require('helpers/streams');

const { MESSAGE_RECEIVE, MESSAGE_SEND } = require('brain/events/message');
const { ACTION_FULFILL } = require('brain/events/actions');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function mapFromModuleToLIst(modules, key, evaluate) {
	return _.reduce(modules, (accum, module) => {
		module = evaluate(module);
		return _.assign({}, accum, { [module[key]] : module });
	}, {});
}

function generateEventStream() {
	let pool = kefir.pool();
	pool.dispatch = (e) => pool.plug(kefir.constant(e));
	return pool;
}

function removeConversation(conversations, convo) {
	return _.without(conversations, [convo]);
}

function getIntent(intents, action) {
	if (action && intents[action]) {
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

	adapters = mapFromModuleToLIst(adapters, 'id', adapter => adapter(eventStream, config));
	actions = mapFromModuleToLIst(actions, 'id', action => action(config));
	dialogs = mapFromModuleToLIst(dialogs, 'name', dialog => dialog(config));
	entities = mapFromModuleToLIst(entities, 'name', entity => entity(config));

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