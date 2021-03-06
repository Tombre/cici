const _ = require('lodash');
const kefir = require('kefir');

/*----------------------------------------------------------
Intent
----------------------------------------------------------*/

function intent(dialogName, name, initialIntent) {

	name = dialogName + '/' + name;

	const definition = {
		name,
		initialIntent,
		dialog: dialogName,
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
						usedParamInstances[id] = { param, text };
						
						return '<||>' + delim + id + '<||>';

					})
					.value();
				sayings = sayings(params);
			}

			if (!_.isArray(sayings)) throw new Error('Argument in "userSays" call must return an array');

			willSay = sayings.map(saying => {

				let def = { data: [], isTemplate };

				// when there is no template 
				if (saying.indexOf('<||>') === -1) {
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
	
			if (!_.isFunction(fulfilmentFn)) throw new Error('A fulfillWith call was not provided with a proper fulfilmentFn')

			let solution = (convo, response) => {

				// The following lines are to allow the chaining dispatch methods.
				let mappedConvo = _.mapValues(convo, (fn, name) => {
					if (!_.isFunction(fn) || name === 'getState') return fn;
					return function() { 
						fn(...arguments);
						return mappedConvo;
					}
				});

				return fulfilmentFn(mappedConvo, response);
			};

			this.definition.solutions.push(solution);
			return this;
		};

		this.requires = function(contexts) {
			contexts = _.isArray(contexts) ? contexts : [contexts];
			this.definition.contexts = _.union(this.definition.contexts, contexts);
			return this;
		}

		// alias of "requires"
		this.requiresContext = this.requires;


		// SETUP

		// push the initial solution to set the correct context. This will only trigger for the initial intent.
		this.fulfillWith((convo, response) => {
			if (!_.find(response.contexts, context => context.name === dialogName)) {
				return convo.setContext(dialogName, true);
			}
		});

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
	resolve.intent.approval = (context) => intent(definition.name, (context + '-approval'), false).requires(context).userSays([ 'sure', 'ok', 'yep', 'yeah', 'yes']);
	resolve.intent.refusal = (context) => intent(definition.name, (context + '-refusal'), false).requires(context).userSays([ 'no', 'nope', 'nup', 'nah', 'no']);

	resolve.registerIntent = (intent) => { definition.intents[intent.definition.name] = intent };

	resolve.param = param;

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