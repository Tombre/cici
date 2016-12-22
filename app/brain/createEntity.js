const _ = require("lodash")

/*----------------------------------------------------------
Entity
----------------------------------------------------------*/

function Entity(name) {

	const definition = { 
 		name, 
 		entries: [],
 		isEnum: false
 	};

	const resolve = function(config) {
		return _.assign({}, definition);
	};

	// Setup entries
	// { "Coffee Maker": ["coffee maker", "coffee machine",  "coffee"] }
	resolve.entries = function(entries) {
 		if (!_.isPlainObject(entries) && !_.isArray(entries)) throw new Error(`${name}: Entries must be expressed as a plain object map of values and synonyms, or a list of values`);
		if (definition.isEnum) definition.entries = [];
		if (_.isArray(entries)) entries = _.reduce(entries, (map, entry) => ((map[entry] = [entry]) && map), {});
		definition.entries = _.union(definition.entries, _.map(entries, (synonyms, value) => ({ value, synonyms })));
		definition.isEnum = false;
		return resolve;
 	};

 	// Setup a template
 	//  {}
 	resolve.template = function(entities, fn) {
 		let templates = fn.apply(null, entities.map(entity => {
 			let name = entity().name;
 			return (alias => `@${name}:${(alias || name)}`);
 		}));
 		if (!definition.isEnum) definition.entries = [];
 		definition.entries = _.union(definition.entries, templates.map(text => ({ value: text, synonyms: [text] })));
 		definition.isEnum = true;
 		return resolve;
 	};

	return resolve;

};

/*----------------------------------------------------------
createEntity
----------------------------------------------------------*/

module.exports = Entity;
