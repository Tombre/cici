module.exports = createDialog('createBouquet', dialog => {

	/*
		OUTCOME
	*/

	// let outcome = dialog.outcome()
	// 	.requireParams()

	let boquetConfiguration = {
		colours: [],
		flowerTypes: []
	};

	// ------------------------------------------------------------------------

	/*
		START
	*/

	dialog.intent('start')
		.userSays(params => [
			`I'd like to buy a bouquet`,	
			`I'd like to buy a bouquet with ${params.colour('red')} and ${params.colour('blue')} flowers`
		])
		.params({
			'colour': dialog.params()
		})
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
		});

	dialog.intent.approval('should-compose')
		.fulfillWith(
			dialog.fulfillment()
				.promptWith('Great! What would you like to compose the flowers with?')
				.setContext('do-compose');
		)

	// same as:
	// dialog.intent('yes-should-compose')
	// 	.requires('should-compose')
	// 	.userSays([ 'sure', 'ok', 'yep'])
	// 	.fulfillWith(
	// 		dialog
	// 			.fulfillment()
	// 			.promptWith('Great! What would you like to compose the flowers with?')
	// 			.setContext('do-compose');
	// 	)

	dialog.intent.refusal('should-compose')
		.fulfillWith(
			dialog.fulfillment()
				.promptWith('Ok, can I offer you a different bouquet for a certain occasion?')
				.setContext('should-occasion');
		)

	dialog.intent.approval('should-occasion')
		.fulfillWith(
			dialog.fulfillment()
				.promptWith('Great! What kind of occasion would you like the flowers for?') 
				.setContext('do-occasion');
		)

	dialog.intent.refusal('should-occasion')
		.fulfillWith(
			dialog.fulfillment()
				.promptWith('Ok, no worries then')
				.setContext('exit');
		)

	// ------------------------------------------------------------------------

	/*
		OCCASION
	*/

	dialog.intent('for-occasion')
		.requires('do-occasion')
		.userSays(params => [params.occasion])
		.params({
			'occasion': dialog.params().entity('occasion')
		})
		.fulfillWith(
			dialog.fulfillment()
				.setContext('order-ready');
				.promptWith(params => `Ok great, ready to order a bouquet for ${params.occasion}?`)
		);



	// ------------------------------------------------------------------------

	/*
		COMPOSE
	*/

	dialog.intent('addFlowers')
		.requires(['do-compose'])
		.userSays(params => [`add ${params.colour} ${params.flowerType}`], true)
		.params({
			'colour': dialog.params()
			'flowerType': dialog.params()
		})
		.fulfillment(response => {
			let fulfillment = dialog.fulfilment();
			let {colour, flowerType} = response.params
			if (colour && flowerType) {
				fulfillment
					.promptWith('Ok anything else?')
					.setContext('do-compose')
			}
			return fulfilment;
		})

	dialog.intent.refusal('do-compose')
		.fulfillWith(
			dialog.fulfillment()
				.promptWith('Ok, no worries then, all finished?')
				.setContext('complete');
		)

	// ------------------------------------------------------------------------

	/*
		ORDER COMPLETE
	*/

	dialog.intent('complete')
		.requires(['order-ready'])
		.userSays([ 'sure', 'ok', 'yep'])
		.fulfillWith('Great! Will send the flowers now)
		.action('orderFlowers');

});