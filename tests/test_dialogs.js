const _ = require('lodash');
const { argv } = require('yargs');
const mongoose = require('mongoose');
const onExit = require('death');

const dialogFlows = require('./dialogFlows');

const createAdapter = require('brain/createAdapter');
const actions = require('actions')
const dialogs = require('dialogs')
const entities = require('entities')

const connect = require('memory');
const Brain = require('brain');

/*----------------------------------------------------------
Helper
----------------------------------------------------------*/

function getDialogsToTest() {
	if (argv.t) {
		return _.find(dialogFlows, { name: argv.t });
	}
	return dialogFlows;
}

/*----------------------------------------------------------
Config
----------------------------------------------------------*/

const transcript = _.reduce(getDialogsToTest(), (messages, dialog) => {
	return [].concat(messages, dialog.transcript);
}, []);


/*----------------------------------------------------------
Cleanup
----------------------------------------------------------*/

onExit({ uncaughtException: true, debug: true })((signal, err) => {
	if (err) {
		throw err;
		return;
	}
	end();
});

/*----------------------------------------------------------
Test
----------------------------------------------------------*/

function runTranscript(readMessage, onSayEvent) {
	
	let transcriptIndex = 0;

	const msgFns = transcript.map(text => () => {
		readMessage({ text }, true)
	});
	
	const readNext = () => {

		msgFns[transcriptIndex]();
		transcriptIndex++;
		// timeout incase more than one fulfillments are run per message
		const unsubscribe = onSayEvent(event => {
			unsubscribe();
			if (transcriptIndex !== msgFns.length) {
				// a poor mans way of respecting conversational turn taking:
				return setTimeout(readNext, 100);
			}
			return setTimeout(end, 100);
		});
	}

	readNext();

}

function end() {
	mongoose.connection.db.dropDatabase((err, result) => {
		if (err) {
			throw err;
			return;
		}
		console.log('Database cleaned');
		mongoose.connection.close();
		process.exit();
	});
}

function start() {
	connect(() => {
		const brain = new Brain(
			[createAdapter('test', runTranscript)],
			actions,
			dialogs,
			entities
		);
	})
}

start();



