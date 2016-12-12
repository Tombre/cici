const _ = require('lodash');
const kefir = require('kefir');
const { fulfillAction } = require('brain/events/actions');
const { sendMessage } = require('brain/events/message');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

function intent(subject, name, initialIntent) {

	name = initialIntent ? name : (subject.dialog + '/' + name);

	const definition = {
		name: ,
		initialIntent,
		auto: true,
		contexts: [],
		templates: [],
		userSays: [],
		responses: {
			action: `${name}_trigger`,
			resetContexts: false
			parameters: []
		}
	};

	const setDefinition = _.partial(subject.setDefinition, name, 'intent');
	const solutions = [];

	const config = function() {

		/*
			USER SAYS
		*/

		this.userSays = function(sayings) {
			
			let { userSays } = definition;
			let willSay = [];
			
			sayings = _.isFunction(sayings) ? sayings(params) : sayings;

			if (!_.isArray(sayings)) throw new Error('Argument in "userSays" call must return an array');

			// paramaters will be into the string via @name
			sayings.forEach(saying => willSay.push({
				"data": [{
					text: saying
				}]
			});

			definition.userSays.concat(willSay);

			return this;

		};

		this.params = function(params) {
			if (!_.isArray(params)) throw new Error('Intent params() call must be provided an array of params as the first argument');
			definition.responses.parameters.concat(params);
			return this;
		};

		this.fulfillWith = function(fulfilmentFn) {
			solutions.push(response => fulfilmentFn(response));
			return this;
		};

		this.action = function(name, params) {
			solutions.push(response => subject.dispatchToAction(name, params));
			return this;
		};

	}

	setDefinition(definition);
	return (new config());

}

/*----------------------------------------------------------
Params
----------------------------------------------------------*/

function params(subject, name, value, default) {
	const entity = (name) => {};
	return {
		name, 
		value: value || ('$' + name),
		required: false,
		entity
	}
}

/*----------------------------------------------------------
Fulfilment
----------------------------------------------------------*/

function fulfilment(subject) {

	function solution() {

		const chain = [];
		const fn = function(response) { chain.forEach(eval => eval(response)) }

		fn.promptWith= function(text) {
			chain.push(response => {
				let text = _.isFunction(text) ? text(response.params) : text;
				subject.say(text);
			});
			return fn;
		}

		fn.setContext= function(context) {
			chain.push(response => subject.setContext(context));
			return fn;
		}

		return fn;

	};

	return (new solution());

}

/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

function Dialog(name) {

	let pushStream = kefir.pool();
	let currentContext = [name];
	
	let definition = {
		name,
		intents: {},
		entities: {}
	};

	const subject = {

		dialog: name,

		say: function(text) {
			pushStream.plug(kefir.constant(sendMessage({ text });
		},
		
		dispatchToAction: function(name, params) {
			pushStream.plug(kefir.constant(fulfillAction(name, params));
		},
		
		setContext: function(ctx) {
			currentContext = _.isArray(ctx) ? ctx : [ctx];
		},
		
		setDefinition: function(type, id, obj) {
			definition[type][id] = obj;
		}

	};

	const resolve = function() {
		return _.assign({}, definition, { pushStream });
	};

	resolve.intent = _.partial(intent, subject);
	resolve.intent.approval = (name) => intent(subject, name, false).userSays([ 'sure', 'ok', 'yep']);
	resolve.intent.refusal = (name) => intent(subject, name, false).userSays([ 'no', 'nope', 'nup']);
	resolve.params = _.partial(params, subject);
	resolve.fulfilment = _.partial(fulfilment, subject);

	return resolve;

};

/*----------------------------------------------------------
createDialog
----------------------------------------------------------*/

module.exports = function(name, setup) {
	const dialog = Dialog(name);
	setup(dialog);
	return dialog();
}