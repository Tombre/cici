Error.stackTraceLimit = Infinity;

const _ = require('lodash');

const adapters = require('./adapters')
const actions = require('./actions')
const dialogs = require('./dialogs')
const entities = require('./entities')

const { whenDatabaseReady } = require('./memory');
const Brain = require('./brain');

/*----------------------------------------------------------
App
----------------------------------------------------------*/

module.exports = function Cici() {
	whenDatabaseReady(() => {
		this.brain = new Brain(adapters, actions, dialogs, entities);
	})
}