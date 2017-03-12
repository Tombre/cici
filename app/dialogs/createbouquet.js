const createDialog = require('brain/createDialog');

module.exports = createDialog('createBouquet', dialog => {

	/*----------------------------------------------------------
	Options setup
	----------------------------------------------------------*/

	let boquetConfiguration = {
		colours: [],
		flowerTypes: []
	};

	/*----------------------------------------------------------
	Intents
	----------------------------------------------------------*/

	// ------------------------------------------------------------------------

	/*
		START
	*/

	dialog.registerIntent(
		dialog.intent('start', true)
			.params([
				dialog.param('colour').entity('colour').isList(true)
			])
			.userSays(params => [
				`I'd like to buy a bouquet`
			])
			.fulfillWith((dialog, response) => {
				return dialog
					.setContext('should-compose')
					.say('Would you like to compose one yourself?')
			}))

	dialog.registerIntent(
		dialog.intent.approval('should-compose')
			.fulfillWith((dialog, response) => {
				return dialog
					.say('Great! What would you like to compose the flowers with?')
					.setContext('do-compose')
			}))

	dialog.registerIntent(
		dialog.intent.refusal('should-compose')
			.fulfillWith((dialog, response) => {
				return dialog
					.say('Ok, can I offer you a different bouquet for a certain occasion?')
					.setContext('should-occasion')
			}))

	dialog.registerIntent(
		dialog.intent.approval('should-occasion')
			.fulfillWith((dialog, response) => {
				return dialog
					.say('Great! What kind of occasion would you like the flowers for?') 
					.setContext('do-occasion')}))

	dialog.registerIntent(
		dialog.intent.refusal('should-occasion')
			.fulfillWith((dialog, response) => {
				return dialog
					.say('Ok, no worries then')
					.setContext('exit')}))

	// ------------------------------------------------------------------------

	/*
		OCCASION
	*/

	dialog.registerIntent(
		dialog.intent('for-occasion')
			.requires('do-occasion')
			.params([
				dialog.param('occasion').entity('occasion')
			])
			.userSays(params => [params.occasion()], true)
			.fulfillWith((dialog, response) => {
				return dialog
					.setContext('order-ready')
					.say(`Ok great, ready to order the bouquet?`)}));



	// ------------------------------------------------------------------------

	/*
		COMPOSE
	*/

	dialog.registerIntent(
		dialog.intent('addFlowers')
			.requires(['do-compose'])
			.params([
				dialog.param('colour').entity('colour').isList(true),
				dialog.param('flowerType').entity('flowerType').isList(true)
			])
			.userSays(params => [`add ${params.colour()} ${params.flowerType()}`], true)
			.fulfillWith((dialog, response) => {
				let colour = response.meaning.parameters.colour;
				let flowerType = response.meaning.parameters.flowerType
				if (colour && flowerType) {
					boquetConfiguration.colours.concat(colour);
					boquetConfiguration.flowerTypes.concat(flowerType);
					dialog
						.say('Ok anything else?')
						.setContext('do-compose')
				}
			}))

	dialog.registerIntent(
		dialog.intent.refusal('do-compose')
			.fulfillWith((dialog, response) => {
				return dialog
					.say('Ok, no worries then, all finished?')
					.setContext('complete')}))

	// ------------------------------------------------------------------------

	/*
		ORDER COMPLETE
	*/

	dialog.registerIntent(
		dialog.intent('complete')
			.requires(['order-ready'])
			.userSays([ 'sure', 'ok', 'yep'])
			.fulfillWith((dialog, response) => {
				return dialog
					.say('Great! Will send the flowers now')
					.endDialog()
			}))

});