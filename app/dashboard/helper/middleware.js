function chainMiddleWare() {
	let fns = [...arguments];
	return function(next) {
		fns.forEach(fn => fn.apply(this, [...arguments]));
	}
}

module.exports.chainMiddleWare = chainMiddleWare;