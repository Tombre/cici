const _ = require('lodash');

function flattenGroup(actions) {

	return _.reduce(actions, (result, value, key) => {
		let pair = {};
		if (_.isFunction(value)) {
			pair[key] = value;
		} else {
			_.assign(pair, flattenGroup(value));
		};
		return _.extend(result, pair);
	}, {});
	
}

module.exports.flattenGroup = flattenGroup;