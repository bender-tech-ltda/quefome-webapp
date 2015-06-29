var config = $require("config");

module.exports = {
	beforeLoad: function(router) {
		router.use(function(req, res, next) {
			req.authorized = app.config.debug || (req.xhr && req.headers["x-user-accept"]);	
			next();
		});
	},

	afterLoad: function(router) {
		router.get("/*", function(req, res) {
			res.render("index", config.view);
		});
	}
};