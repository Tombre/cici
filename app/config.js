const sys_config = require('../config.json');
const test_config = require('../config.test.json');
const { argv } = require('yargs');
const _ = require('lodash');

module.exports = _.merge(
	{}, 
	sys_config, 
	(process.env.NODE_ENV === 'test' ? test_config : {})
);