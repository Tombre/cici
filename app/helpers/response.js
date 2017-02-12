const _ = require('lodash');

/*----------------------------------------------------------
Functions
----------------------------------------------------------*/

/*
* Choose
* Chooses a message at random from an array of messages
*/
function choose(messages) {
	return messages[_.random(0, (messages.length -1))];
}


/*
* Choose For
* Simple helper function to choose a value from a message map
*/
function chooseFor(value, messageMap, defaultMsg = '') {
	if (messageMap[value]) return messageMap[value];
	return defaultMsg;
}


module.exports = { choose, chooseFor };