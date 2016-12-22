const { prompt } = require('promptly');
const createAdapter = require('brain/createAdapter');

module.exports = createAdapter('shell', function(readMessage, onSendEvent) {

	function promptForMessage() {
		prompt('message:', { silent: true }, (error, value) => {
			readMessage({
				text: value
			}, true);
		})
	};

	promptForMessage();

	onSendEvent(event => {
		console.log(`Cici: ${event.text}`);
		console.log('\n');
		promptForMessage();
	});

});