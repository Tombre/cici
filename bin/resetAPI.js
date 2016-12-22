const _ = require('lodash');
const api = require('helpers/api');
const chalk = require('chalk');
const ProgressBar = require('progress');

function clearFromAPI(type) {
	return api.GET(type)
		.then(data => {
			console.log(`${data.length} ${type} to clear`);
			if (!data.length) return Promise.resolve(true);
			let bar = new ProgressBar(`Clearing ${type} [:bar] :percent`, { total: data.length });
			return Promise.all(data.map(dat => {
				return api.DELETE(type, { id: dat.id })
					.then(resp => {
						bar.tick();
						return resp;
					});
				}));
		})
		.catch(e => {
			console.log(chalk.red.bold(`Error clearing  ${type}`));
			console.log(e);
		})
}

console.log(chalk.green.bold('Cleaning API'));

Promise.resolve(true)
	.then(() => clearFromAPI('intents'))
	.then(() => clearFromAPI('entities'))
	.then(() => {
		console.log(chalk.green.bold('API Cleaned successfully'));
	});

	
