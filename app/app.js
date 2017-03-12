Error.stackTraceLimit = Infinity;

const adapters = require('./adapters')
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
			dialogs,
			entities
		);
	})
}