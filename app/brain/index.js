const kefir = require('kefir');
const _ = require('lodash');
const { Conversation, doesConvoMatchEvent } = require('./conversation');
const { filterbyEventType } = require('helpers/streams');
const { MESSAGE_RECEIVE, MESSAGE_SEND } = require('brain/events/message');

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
	// event stream should always be active so we add a no-op to onValue
	pool.onValue(() => {});
	// add a convenience dispatch method
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

module.exports = function(adaptersConstructors, dialogConstructors, entityConstructors) {

	/*----------------------------------------------------------
	setup
	----------------------------------------------------------*/

	const config = {};
	const eventStream = generateEventStream();

	/*----------------------------------------------------------
	Conversations
	----------------------------------------------------------*/

	// const conversations = [];

	/*
	*	START NEW CONVERSATIONS
	*/

	const conversationStream = filterbyEventType(MESSAGE_RECEIVE, eventStream)
		.map(e => e.payload)
		.scan((conversations, e) => {
			let indexOfConvo = _.findIndex(conversations, convo => doesConvoMatchEvent(convo, e));
			if (indexOfConvo === -1 && e.triggerConversation === true) {
				let newConvo = new Conversation(eventStream, e, getIntent.bind(null, intents), removeConversation.bind(null, conversations));
				conversations = conversations.slice(0).push(newConvo);
			}
			return conversations;
		}, [])
		.observe(() => {});

	/*----------------------------------------------------------
	Initialization
	----------------------------------------------------------*/

	const dialogs = mapFromModuleToLIst(dialogConstructors, 'name', dialog => dialog(config));
	const entities = mapFromModuleToLIst(entityConstructors, 'name', entity => entity(config));
	const intents = _.reduce(dialogs, (accum, dialog) => _.assign({}, accum, dialog.intents), {});
	const adapters = mapFromModuleToLIst(adaptersConstructors, 'id', adapter => adapter(eventStream, config));

}