const passport = require('passport');
const password = require('password');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const { User } = require('memory/user');
const jwt = require('jsonwebtoken');

/*----------------------------------------------------------
	Config
----------------------------------------------------------*/

const jwtOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeader(),
	secretOrKey: password(5)
}

/*----------------------------------------------------------
	Strategies
----------------------------------------------------------*/

/*
*	JWT Strategy
*/

passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, done) {
	 User.findOne({id: jwt_payload.id})
	 	.then(user => {
	 		if (!user) return done(null, false);
			return done(null, user);
	 	})
	 	.catch(err => done(err, false))
}));

passport.use(new LocalStrategy(function(username, password, done) {
	User.findOne({ username: username })
		.then(user => {
			if (!user) return done(null, user);
			return user
		})
		.catch(err => done(err, false))
}));


/*----------------------------------------------------------
	Authenticate
----------------------------------------------------------*/

/*
*	Require Auth
*	Authentication strategy for requiring JWT authentication
*/

const requireAuth = passport.authenticate('jwt', { 
	session: false,
	successRedirect: '/',
	failureRedirect: '/login' 
});

module.exports.requireAuth = requireAuth;


/*
*	Post Login
*	Middleware that sends the JWT when the login is complete
*/

const postLogin =  function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		
		if (err) throw err;
		
		if (!user) {
			return res.send({ msg: 'Login incorrect' });
		}

		req.logIn(user, function(err) {
			
			if (err) return next(err);

			let { secretOrKey } = jwtOptions;
			let token = jwt.sign(user, secretOrKey, { expiresIn: 631139040 });
			
			res.send({ user: user, jwtToken: token });

		});

	})(req, res, next);
};

module.exports.postLogin = postLogin;
