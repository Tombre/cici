/*----------------------------------------------------------
Register Intent
----------------------------------------------------------*/

module.exports = function(id, callback) {
	return function(eventStream) {
		return { id, fn: callback };
	};
}