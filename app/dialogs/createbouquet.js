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
				`I'd like to buy a bouquet`,	
				`I'd like to buy a bouquet with ${params.colour('red')} and ${params.colour('blue')} flowers`
			])
			.fulfillWith(response => {
				let fulfillment = dialog.fulfilment();
				let { colours } = response.parameters;
				if (colours.length > 0) {
					boquetConfiguration.colours = colours;
					fulfillment
						.promptWith(`Ok, so order a bouquet with a mixture of flowers (${colours.join(', ')})`)
						.setContext('order-ready');
				} else {
					fulfillment
						.promtWith('Would you like to compose one yourself?')
						.setContext('should-compose');
				}
				return fulfillment;
			}))

	dialog.registerIntent(
		dialog.intent.approval('should-compose')
			.fulfillWith(
				dialog.fulfilment()
					.promptWith('Great! What would you like to compose the flowers with?')
					.setContext('do-compose')));

	dialog.registerIntent(
		dialog.intent.refusal('should-compose')
			.fulfillWith(
				dialog.fulfilment()
					.promptWith('Ok, can I offer you a different bouquet for a certain occasion?')
					.setContext('should-occasion')))

	dialog.registerIntent(
		dialog.intent.approval('should-occasion')
			.fulfillWith(
				dialog.fulfilment()
					.promptWith('Great! What kind of occasion would you like the flowers for?') 
					.setContext('do-occasion')))

	dialog.registerIntent(
		dialog.intent.refusal('should-occasion')
			.fulfillWith(
				dialog.fulfilment()
					.promptWith('Ok, no worries then')
					.setContext('exit')))

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
			.fulfillWith(
				dialog.fulfilment()
					.setContext('order-ready')
					.promptWith(params => `Ok great, ready to order a bouquet for ${params.occasion}?`)));



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
			.fulfillWith(response => {
				let fulfilment = dialog.fulfilment();
				let {colour, flowerType} = response.params
				if (colour && flowerType) {
					boquetConfiguration.colours.push(colour);
					boquetConfiguration.flowerTypes.concat(flowerType);
					fulfilment
						.promptWith('Ok anything else?')
						.setContext('do-compose')
				}
				return fulfilment;
			}))

	dialog.registerIntent(
		dialog.intent.refusal('do-compose')
			.fulfillWith(
				dialog.fulfilment()
					.promptWith('Ok, no worries then, all finished?')
					.setContext('complete')))

	// ------------------------------------------------------------------------

	/*
		ORDER COMPLETE
	*/

	dialog.registerIntent(
		dialog.intent('complete')
			.requires(['order-ready'])
			.userSays([ 'sure', 'ok', 'yep'])
			.fulfillWith('Great! Will send the flowers now')
			.action('orderFlowers', boquetConfiguration));

});