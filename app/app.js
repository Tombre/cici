Error.stackTraceLimit = Infinity;

const adapters = require('./adapters')
const actions = require('./actions')
const dialogs = require('./dialogs')
const entities = require('./entities')

const connect = require('./memory');
const Brain = require('./brain');

/*----------------------------------------------------------
App
----------------------------------------------------------*/

module.exports = function Cici() {
	connect(() => {
		const brain = new Brain(
			adapters,
			actions,
			dialogs,
			entities
		);
	})
}