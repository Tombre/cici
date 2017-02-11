const createDialog = require('brain/createDialog');


/*----------------------------------------------------------
Dialog
----------------------------------------------------------*/

module.exports = createDialog('introduction', dialog => {

	dialog.registerIntent(
		dialog.intent('intro', true)
			.params([
				dialog.param('fullname').entity('sys.any')
			])
			.userSays(params => [
				`Hi`,
				`Hey`,
				`Yo`,
				`Sup`,
				`Hi there`,
				`Heya`,
				`Hello`,
			])
			.fulfillWith()
	)

});