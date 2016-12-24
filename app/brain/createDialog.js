const _ = require('lodash');
const kefir = require('kefir');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

function intent(dialogName, name, initialIntent) {

	name = dialogName + '/' + name;

	const definition = {
		name,
		initialIntent,
		contexts: (initialIntent ? [] : [dialogName]),
		userSays: [],
		parameters: [],
		// all solutions take two arguments, a dispatch object (for dispatching actions) and a response
		solutions: []
	};

	const Factory = function() {

		this.definition = definition;

		this.userSays = function(sayings, isTemplate = false) {
			
			let delim = '<%id=';
			let usedParamInstances = {};
			let willSay;

			if (_.isFunction(sayings)) {

				if (!this.definition.parameters) console.log(`You have not added any parametersto the intent ${name}, you might want to add some before you run userSays `)

				let params = _.chain(this.definition.parameters)
					.keyBy(param => param.name)
					.mapValues(param => text => {

						if (isTemplate) {
							if (!param.entityName) throw new Error(`Param ${param.name} must be linked to an entity if you are using template mode`);
							return `@${param.entityName}:${param.name}`
						}

						let id = _.uniqueId();
						usedParamInstances[id] = {  param, text };
						
						return '<||>' + delim + id + '<||>';

					})
					.value();
				sayings = sayings(params);
			}

			if (!_.isArray(sayings)) throw new Error('Argument in "userSays" call must return an array');

			willSay = sayings.map(saying => {

				let def = { data: [], isTemplate };

				// when there is no template 
				if (saying.indexOf('<||>') <= 0) {
					def.data.push({ text: saying });
					return def;
				}

				saying = saying.split('<||>');
				def.data = saying.map(part => {
					
					if (part.indexOf(delim) === -1) return { text: part };
					let instance = usedParamInstances[part.substring(delim.length)];

					let data = {
						text: instance.text,
						alias: instance.param.name
					}
					
					if (instance.param.entityName) data.entity = instance.param.entityName;
					return data;

				});

				return def;

			});

			this.definition.userSays = _.union(this.definition.userSays, willSay);
			return this;

		};

		this.params = function(params) {
			if (!_.isArray(params)) throw new Error('Intent params() call must be provided an array of params as the first argument');
			this.definition.parameters = this.definition.parameters.concat(params);
			return this;
		};

		this.fulfillWith = function(fulfilmentFn) {
			let solution = fulfilmentFn;
			if (fulfilmentFn.isFulfilment !== true) {
				solution = (dispatch, response) => {
					// map the dispatch so you can chain (interface is a little easier to use this way)
					let mappedDispatch = _.mapValues(dispatch, dispatchFn => {
						return function () {
							dispatchFn(...arguments);
							return dispatch;
						}
					});
					return fulfilmentFn(mappedDispatch, response);
				};
			}
			this.definition.solutions.push(solution);
			return this;
		};

		this.requires = function(contexts) {
			contexts = _.isArray(contexts) ? contexts : [contexts];
			this.definition.contexts = _.union(this.definition.contexts, contexts);
			return this;
		}

	}

	return (new Factory());

}

/*----------------------------------------------------------
Params
----------------------------------------------------------*/

function param(name, defaultValue) {

	function Factory() {
		
		this.name = name; 
		this.value = ('\$' + name);
		this.defaultValue = defaultValue;
		this.isList = false;

		this.entity = (name) => {
			this.entityName = name;
			return this;
		};

		this.setValue = (value) => {
			this.value = value;
			return this;
		};

		this.isList = (bool) => {
			this.isList = Boolean(bool);
			return this;
		}

	}

	return (new Factory());

}

/*----------------------------------------------------------
Fulfilment
----------------------------------------------------------*/

function fulfilment() {

	const chain = [];
	const fn = function(dispatch, response) { chain.forEach(eval => eval(dispatch, response)) }

	fn.isFulfilment = true;

	fn.say= function(text) {
		chain.push((dispatch, response) => {
			let text = _.isFunction(text) ? text(response.params) : text;
			dispatch.say(text);
		});
		return fn;
	}

	fn.action = function(name, params) {
		let actionfn = (dispatch, response) => dispatch.action(name, params);
		if (_.isFunction(name)) fn = (dispatch, response) => name(response);
		chain.push(actionfn);
		return fn;
	};

	fn.setContext= function(context) {
		let contexts = _.isArray(context) ? context : [context];
		chain.push((dispatch, response) => {
			dispatch.setContext(contexts)
		});
		return fn;
	}

	return fn;

}

/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

function Dialog(name) {
	
	let definition = {
		name,
		intents: {},
	};

	const resolve = function(config) {
		return _.assign({}, definition);
	};

	resolve.intent = (name, initialIntent) => intent(definition.name, name, initialIntent);
	resolve.intent.approval = (context) => intent(definition.name, (context + '-approval'), false).requires(context).userSays([ 'sure', 'ok', 'yep']);
	resolve.intent.refusal = (context) => intent(definition.name, (context + '-refusal'), false).requires(context).userSays([ 'no', 'nope', 'nup']);

	resolve.registerIntent = (intent) => { definition.intents[intent.definition.name] = intent };

	resolve.param = param;
	resolve.fulfilment = fulfilment;

	return resolve;

};

/*----------------------------------------------------------
createDialog
----------------------------------------------------------*/

module.exports = function(name, setup) {
	const dialog = Dialog(name);
	setup(dialog);
	return (config => dialog(config));
}