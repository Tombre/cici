const { prompt } = require('promptly');
const registerAdapter = require('brain/registerAdapter');

module.exports = registerAdapter('shell', function(readMessage, onSendEvent) {

	function promptForMessage() {
		prompt('message:', { silent: true }, (error, value) => {
			readMessage({
				text: value
			}, true);
		})
	};

	promptForMessage();

	onSendEvent(event => {
		console.log(event.text);
		promptForMessage();
	});

});