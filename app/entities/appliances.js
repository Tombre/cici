const createEntity = require('brain/createEntity'); 

let appliances = createEntity('appliances')
	.entries({
		"Coffee Maker": ["coffee maker", "coffee machine",  "coffee"],
		"Thermostat": ["Thermostat", "heat", "air conditioning"],
		"Lights": ["lights", "light", "lamps"],
		"Garage door": ["garage door", "garage"]
	});


let given_name = createEntity('sys.given-name');
let last_name = createEntity('sys.last-name');

let person = createEntity('person')
	.template([given_name, last_name], (given_name, last_name) => [
		`${given_name()} ${last_name()}`,
		given_name()
	]);

module.exports = {
	appliances,
	given_name,
	last_name,
	person
};