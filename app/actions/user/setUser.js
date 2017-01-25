module.exports = createAction('setUser', function(dispatch, params) {

	let user = params.user;
	console.log('creating', params.user);

	var kitty = new User({ 
		givenName: user.givenName,
		lastName: user.lastName,
		profiles: user.profiles.map(profile => {
			const { type, link } = profile;
			return { type, link };
		})
	});
	
});