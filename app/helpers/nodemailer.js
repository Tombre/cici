const nodemailer = require('nodemailer');
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
		text: content,
	};
	
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (error, info) => {
			 if (error) return reject(error);
			 resolve(info);
		});
	});
	
}

module.exports.sendMail = sendMail;