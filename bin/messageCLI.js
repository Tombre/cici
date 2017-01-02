const blessed = require('blessed');
const io = require('socket.io-client');
const config = require('../config.json')["socket"];
const chalk = require('chalk');

let socket = io(`http://localhost:${config.port}`, {
	reconnection: true
});

const screen = blessed.screen({
	smartCSR: true,
	title: 'Cici chat 🚀'
});

const chatBox = blessed.box({
	label: 'Chat',
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
		ch: ' ',
		inverse: true,
	}
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

input.key(['C-c'], () => process.exit(0));

screen.append(chatBox);
screen.append(inputBox);

socket.on( 'connect', () => {
	chatLog.log(chalk.green(`...Connected`));
});

socket.on('say', (event) => {
	chatLog.log(`-> Cici: ${event.text}`);
});

socket.on( 'disconnect', () => {
	chatLog.log(chalk.red(`Disconnected from chat... Trying to reconnect`));
	screen.render();
});

screen.render();
input.focus();
