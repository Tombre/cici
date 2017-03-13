const createAdapter = require('brain/createAdapter');
const config = require('config').slack;
const { RtmClient, CLIENT_EVENTS, RTM_EVENTS } = require('@slack/client');
const makeRemoveFormatting = require('slack-remove-formatting');

/*----------------------------------------------------------
Setup
----------------------------------------------------------*/

const bot_token = config.slack_bot_token;
const rtm = new RtmClient(bot_token);

/*----------------------------------------------------------
Adapter
----------------------------------------------------------*/

module.exports = createAdapter('slack', function(readMessage, onSayEvent) {

	let botID;
	let removeFormatting;

	rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
		botID = rtmStartData.self.id;
		removeFormatting = makeRemoveFormatting(rtmStartData)
		console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
	});

	rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {

		console.log('MESSAGE',message);
		
		if (message.user === botID) return;

		let convoStarter = (message.channel.charAt(0) === 'D') ? true : false;
		if (message.text.indexOf(`@${botID}`) >= 0) convoStarter = true;

		readMessage({
			text: removeFormatting(message.text),
			adapterEvent: message,
			author: message.user,
			source: {
				author: message.user,
				channel: message.channel,
				team: message.team
			}
		}, convoStarter);
		
		rtm.sendTyping(message.channel);
	});


	onSayEvent(event => {
		let { text, source } = event;
		if ((source.channel.charAt(0) === 'D') === false) {
			text = `<@${source.user}> ${text}`;
		}
		rtm.sendMessage(text, event.source.channel);
	});

	rtm.start();

});