const createEntity = require('brain/createEntity'); 

let givenName = createEntity('sys.given-name');
let lastName = createEntity('sys.last-name');

let fullName = createEntity('fullName')
	.template([givenName, lastName], (givenName, lastName) => [
		`${givenName()} ${lastName()}`
	])

module.exports = {
	fullName
};