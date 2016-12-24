const _ = require('lodash');

function choose(messages) {
	return messages[_.random(0, (messages.length -1))];
}

module.exports = { choose };