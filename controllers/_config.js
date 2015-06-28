module.exports = function(router) {
	router.use(function(req, res, next) {
		console.log("pudim");

		req.authorized = app.config.debug || (req.xhr && req.headers["x-user-accept"]);	
		next();
	});
};