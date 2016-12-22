/*----------------------------------------------------------
Register Intent
----------------------------------------------------------*/

module.exports = function(id, callback) {
	return function(config) {
		return { id, fn: callback };
	};
}