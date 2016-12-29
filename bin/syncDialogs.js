const ProgressBar = require('progress');
const _ = require('lodash');
const { flattenGroup } = require('helpers/modules');
const dialogs = flattenGroup(require('require-dir-all')('../app/dialogs/', { recursive: true }));
const entities = flattenGroup(require('require-dir-all')('../app/entities/', { recursive: true }));
const api = require('helpers/api');
const chalk = require('chalk');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

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
	return _.chain(dialogs)
		.mapValues(dialog => dialog())
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

	let newAPIIntents = _.differenceBy(api_intents, local_intents, 'name');
	let newLocalIntents = _.differenceBy(local_intents, api_intents, 'name');
	if (newAPIIntents.length) {
		log.warning(`There are ${newAPIIntents.length} new api.ai intents currently seperate to the intents outlined in dialogs. Suggest that you re-create them in manually, otherwise you may experience unexpected results. Differences have been written to the sync log`);
	}
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
			intent => api.POST('intents', null, intent)
				.then(resp => {
					bar.tick();
					return resp;
				})
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
	return _.chain(entities)
		.mapValues(entity => entity())
		.reject(entity => {
			return entity.name.indexOf('sys') === 0;
		})
		.map(mapSystemEntity)
		.value();
}

function getNewEntities(api_entities, local_entities) {
	let newAPIEntities = _.differenceBy(api_entities, local_entities, 'name');
	let newLocalEntities = _.differenceBy(local_entities, api_entities, 'name');
	if (newAPIEntities.length) {
		log.warning(`There are ${newAPIEntities.length} new api.ai entities currently seperate to the entities outlined in dialogs. Suggest that you re-create them in manually, otherwise you may experience unexpected results. Differences have been written to the sync log`);
	}
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
			entity => api.POST('entities', null, entity)
				.then(resp => {
					bar.tick();
					return resp;
				})
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

