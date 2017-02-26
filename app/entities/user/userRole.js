const createEntity = require('brain/createEntity'); 
const { roleTypes } = require('memory/user');

let userSetting = createEntity('userSetting')
	.entries(roleTypes);

module.exports = userSetting;