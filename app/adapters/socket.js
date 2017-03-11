const createAdapter = require('brain/createAdapter');
const config = require('config').socket;
const app = require('http').createServer();
const io = require('socket.io')(app);

module.exports = createAdapter('socket', function(readMessage, onSayEvent) {

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

	});

	onSayEvent(event => {
		io.sockets.emit('say', event);	
	});

	const port = process.env.PORT || config.port;

	app.listen(port, () => {
		console.log(`Socket Listening on port: ${port}`);
	});


});