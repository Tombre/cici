const _ = require('lodash');
const adapters = require('require-dir-all')('./adapters');
const actions = require('require-dir-all')('./actions', { recursive: true });
const Brain = require('./brain');

function flattenActions(actions) {
	return _.reduce(actions, (result, value, key) => {
		let pair = {};
		if (_.isFunction(value)) {
			pair[key] = value;
		} else {
			_.assign(pair, flattenActions(value));
		};
		return _.extend(result, pair);
	}, {});
}

/*----------------------------------------------------------
App
----------------------------------------------------------*/

module.exports = function Cici() {
	this.brain = new Brain(adapters, flattenActions(actions));
}