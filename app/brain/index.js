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

/*----------------------------------------------------------
Brain
----------------------------------------------------------*/

module.exports = function(adapters, actions) {

	const config = {};
	const eventStream = generateEventStream();

	/*----------------------------------------------------------
	setup
	----------------------------------------------------------*/

	adapters = _.mapValues(adapters, adapter => adapter(eventStream));
	actions = _.mapValues(actions, action => action(eventStream));

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
				let newConvo = new Conversation(eventStream, e, removeConversation.bind(null, conversations));
				conversations.push(newConvo);
			}
		});

	/*----------------------------------------------------------
	Action Fulfillment
	----------------------------------------------------------*/

	filterbyEventType(ACTION_FULFILL, eventStream)
		.map(e => e.payload)
		.observe(e => {
			let action = actions[e.intent] || actions['default'];
			action.fn(_.find(conversations, convo => (convo.id === e.conversation)), eventStream.dispatch);
		});

}