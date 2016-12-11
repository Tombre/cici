


module.exports = createDialog('createEvents', dialog => {

	let params = {
		'time' : dialog.param()
			.mapToIntent('set_event_time'),
		'date' : dialog.param()
			.required()
			.mapToIntent('set_event_date'),
		'name' : dialog.param()
			.required()
			.mapToIntent('set_event_name')
	}

	// dialog.intent('set_event_time')
	// 	.promptWith('What time would you like the event to happen?')
	// 	.params('time', params.time)
	// 	.outcome(response => params.time.set(response))

	// dialog.intent('set_event_date')
	// 	.promptWith('What date would you like the event to happen?')
	// 	.params('time', params.time)
	// 	.outcome(params.date.set)

	// dialog.intent('set_event_name')
	// 	.promptWith('What is the name of the event?')
	// 	.params('name', params.name)
	// 	.outcome(params.name.set)
		
	dialog.intent('create_new_event')
		.userSays([`I'd like to setup a new event`])
		.params(params)
		.outcome(dialog.runAction('newEvent'))

	return dialog;

});