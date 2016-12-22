const _ = require('lodash');
const adapters = require('require-dir-all')('./adapters');
const actions = require('require-dir-all')('./actions', { recursive: true });
const dialogs = require('require-dir-all')('./dialogs', { recursive: true });
const entities = require('require-dir-all')('./entities', { recursive: true });
const { flattenGroup } = require('helpers/modules');
const Brain = require('./brain');

/*----------------------------------------------------------
App
----------------------------------------------------------*/

module.exports = function Cici() {
	this.brain = new Brain(adapters, flattenGroup(actions), flattenGroup(dialogs), flattenGroup(entities));
}