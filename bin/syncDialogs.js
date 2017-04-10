const ProgressBar = require('progress');
const _ = require('lodash');

const dialogs = require('../app/dialogs')
const entities = require('../app/entities')

const api = require('helpers/nlp');
const chalk = require('chalk');

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

const config = {};

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function mapFromModuleToLIst(modules, key, evaluate) {
	return _.reduce(modules, (accum, module) => {
		module = evaluate(module);
		return _.assign({}, accum, { [module[key]] : module });
	}, {});
}

function logger(format, toLog) {
	console.log(format(toLog[0]));
	for (var i = 1; i < toLog.length; i++) {
		console.log(toLog[i]);
	}
	 console.log('\n');
}

const log = {
	title: function () { logger(chalk.bold.black, [...arguments]) },
	space: function() { console.log('\n') },
	item: function (text) { console.log(text) },
	success: function () { logger(chalk.bold.green, [...arguments]) },
	warning: function () { logger(chalk.bold.yellow, [...arguments]) },
	error: function () { logger(chalk.red.bold, [...arguments]) }
}



/*----------------------------------------------------------
Intents
----------------------------------------------------------*/

function getSystemIntents() {
	return _.chain(mapFromModuleToLIst(dialogs, 'name', dialog => dialog(config)))
		.reduce((accum, dialog) => _.assign({}, accum, dialog.intents), {})
		.map(mapSystemIntent)
		.value();
}

function mapSystemIntent(intent) {
	intent = intent.definition;
	return {
		name: intent.name,
		auto: true,
		contexts: intent.contexts,
		templates: _.chain(intent.userSays)
			.filter(def => def.isTemplate === true)
			.map(def => {
				return _.trim(_.reduce(def.data, (sum, dat) => {
					return sum + ` ${dat.text}`;
				}, ''))
			})
			.value(),
		userSays: intent.userSays.map(def => {
			return {
				data: def.data.map(data => {
					if (data.entity) data.meta = `@${data.entity}`;
					return data;
				}),
				isTemplate: def.isTemplate,
				count: 0
			}
		}),
		responses: [
			{
				resetContexts: false,
				action: intent.name,
				affectedContexts: [],
				parameters: intent.parameters.map(param => {
					let definition = {
						name: param.name,
						value: param.value,
						defaultValue: param.defaultValue,
						required: false,
						isList: param.isList
					};
					if (param.entityName) definition.dataType = `@${param.entityName}`;
					return definition;
				})
			}
		]
	}
}

function getNewIntents(api_intents, local_intents) {

	let newLocalIntents = _.filter(local_intents, (intent) => {
		let matchingIntent = _.find(api_intents, { name: intent.name });
		if (!matchingIntent) return true;
		if (!_.isEqual(intent, matchingIntent)) {
			intent.id = matchingIntent.id
			return true;
		}
		return false;
	});

	if (!newLocalIntents.length) {
		log.success('No intents to sync')
	} else {
		log.title(`${newLocalIntents.length} intents to sync`);
	};

	return newLocalIntents;

}

function syncNewIntents(newIntents) {
	if (!newIntents.length) return Promise.resolve(true);

	let bar = new ProgressBar('Syncing [:bar] :percent', { total: newIntents.length });
		
	return Promise.all(
		newIntents.map(
			intent => {
				let method = ('id' in intent) ? 'PUT' : 'POST';
				return api[method]('intents', intent, intent)
					.then(resp => {
						bar.tick();
						return resp;
					})
			}
		)
	);
}

/*----------------------------------------------------------
Entities
----------------------------------------------------------*/

function mapSystemEntity(entity) {
	entity.automatedExpansion = false;
	return entity;
}

function getSystemEntities() {
	return _.chain(mapFromModuleToLIst(entities, 'name', entity => entity(config)))
		.reject(entity => {
			return entity.name.indexOf('sys') === 0;
		})
		.map(mapSystemEntity)
		.value();
}

function getNewEntities(api_entities, local_entities) {

	let newLocalEntities = _.filter(local_entities, (entity) => {
		let matchingEntity = _.find(api_entities, { name: entity.name });
		if (!matchingEntity) return true;
		if (!_.isEqual(entity, matchingEntity)) {
			entity.id = matchingEntity.id
			return true;
		}
		return false;
	});

	if (!newLocalEntities.length) {
		log.success('No entities to sync')
	} else {
		log.title(`${newLocalEntities.length} entities to sync`);
	};

	return newLocalEntities;
}

function syncNewEntities(newEntities) {
	if (!newEntities.length) return Promise.resolve(true);
	let bar = new ProgressBar('Syncing [:bar] :percent', { total: newEntities.length });
	return Promise.all(
		newEntities.map(
			entity => {
				let method = ('id' in entity) ? 'PUT' : 'POST';
				return api[method]('entities', entity, entity)
					.then(resp => {
						bar.tick();
						return resp;
					})
			}
		)
	);
}

/*----------------------------------------------------------
Init
----------------------------------------------------------*/

log.title('Retrieving existing intents & entities...')

const local_intents = getSystemIntents();
const local_entities = getSystemEntities();

let entityPromise = api.GET('entities')
	.then(api_entities => getNewEntities(api_entities, local_entities))
	.then(newEntities => syncNewEntities(newEntities))
	.then(savedEntities => {
		log.success('Entities sync complete');
	})
	.catch(e => { 
		log.error('Error syncing entities.', 'ERROR:', e);
	})
	.then(() => api.GET('intents'))
	.then(api_intents => getNewIntents(api_intents, local_intents))
	.then(newIntents => syncNewIntents(newIntents))
	.then(savedIntents => {
		log.success('Intents sync complete');
		process.exit();
	})
	.catch(e => { 
		log.error('Error syncing intents.', 'ERROR:', e);
	})

