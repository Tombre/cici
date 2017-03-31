const { requireAuth, postLogin } = require('./auth');

/*----------------------------------------------------------
Routes
----------------------------------------------------------*/

module.exports = function(app) {

	app.get('/', requireAuth);
	app.get('/login', postLogin);
	app.get('/createAccount', postLogin);

	app.get('/auth/:service/', (req, res) => {
		 res.send(req.params.service);
	});

	app.get('/auth/:service/callback', (res, req) => {

	});

}