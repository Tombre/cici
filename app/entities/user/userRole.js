const createEntity = require('brain/createEntity'); 
const { roleTypes } = require('memory/user');

let userSetting = createEntity('userRole')
	.entries(roleTypes);

module.exports = userSetting;