const createAdapter = require('brain/createAdapter');
const config = require('../../config.json')["slack"];
const { RtmClient, CLIENT_EVENTS, RTM_EVENTS } = require('@slack/client');

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

	rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function(rtmStartData) {
		botID = rtmStartData.self.id;
		console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
	});

	rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
		
		if (message.user === botID) return;

		let convoStarter = (message.channel.charAt(0) === 'D') ? true : false;
		if (message.text.indexOf(`@${botID}`) >= 0) convoStarter = true;

		readMessage({
			text: message.text,
			adapterEvent: message,
			source: {
				user: message.user,
				channel: message.channel,
				team: message.team
			}
		}, convoStarter);
		
		rtm.sendTyping(message.channel);
	});


	onSayEvent(event => {
		rtm.sendMessage(event.text, event.source.channel);
	});

	rtm.start();

});