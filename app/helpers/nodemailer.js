const nodemailer = require('nodemailer');
const striptags = require('striptags');
const config = require('config')["mailer"];

/*----------------------------------------------------------
Config
----------------------------------------------------------*/

const transporter = nodemailer.createTransport(config);

/*----------------------------------------------------------
Mailer
----------------------------------------------------------*/

/*
*	Send mail
*	Sends mail to a recipient
*/
function sendMail(address, subject, content) {
	
	let mailOptions = {
		from: '"cici" <cici@cici.cc>',
		to: address,
		subject,
		text: striptags(content),
		html: content
	};
	
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (error, info) => {
			 if (error) return reject(error);
			 resolve(info);
		});
	});
	
}

module.exports.sendMail = sendMail;