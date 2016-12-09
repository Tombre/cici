const adapters = require('require-dir-all')('./adapters');
const actions = require('require-dir-all')('./actions');
const Brain = require('./brain');

/*----------------------------------------------------------
App
----------------------------------------------------------*/

module.exports = function Cici() {
	this.brain = new Brain(adapters, actions);
}