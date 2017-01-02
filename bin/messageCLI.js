const blessed = require('blessed');
const io = require('socket.io-client');
const config = require('../config.json')["socket"];

const socket = io(`http://localhost:${config.port}`);

const screen = blessed.screen({
	smartCSR: true,
	title: 'Cici chat 🚀'
});

const chatBox = blessed.box({
	label: 'Chats',
	width: '100%',
	height: '100%-3',
	border: {
		type: 'line',
	},
});

const chatLog = blessed.log({
	parent: chatBox,
	tags: true,
	scrollable: true,
	alwaysScroll: true,
	scrollbar: {
		ch: '',
		inverse: true,
	},
	mouse: true,
});

const inputBox = blessed.box({
	label: 'Type your message (press enter to send)',
	bottom: '0',
	width: '100%',
	height: 3,
	border: {
		type: 'line',
	},
});

const input = blessed.textbox({
	parent: inputBox,
	inputOnFocus: true,
});

input.key('enter', () => {
	const text = input.getValue();
	chatLog.log(`{right}${text} <-{/right}`);
	socket.emit('read', { text });
	input.clearValue();
	input.focus();
});

socket.on('say', ({ text }) => {
	chatLog.log(`-> Cici: ${text}`);
});

input.key(['escape', 'q', 'C-c'], function(ch, key) {
	return process.exit(0);
});

screen.append(chatBox);
screen.append(inputBox);

screen.render();

input.focus();