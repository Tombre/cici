const createAdapter = require('brain/createAdapter');
const config = require('../../config.json')["socket"];

module.exports = createAdapter('socket', function(readMessage, onSayEvent) {

	const app = require('http').createServer();
	const io = require('socket.io')(app);

	io.on('connection', socket => {
	
		console.log('a user connected to socket');

		socket.on('disconnect', () => {
			console.log('user disconnected from socket');
		});

		socket.on('read', event => {
			readMessage({
				text: event.text
			}, true);
		});

		onSayEvent(event => {
			socket.broadcast.emit('say', event);	
		});

	});

	const port = process.env.PORT || config.port;

	app.listen(port, () => {
		console.log(`Socket Listening on port: ${port}`);
	});


});