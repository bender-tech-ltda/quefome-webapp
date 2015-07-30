var config = $require("config");

var ViewData = app.models.ViewData;

module.exports = {
	beforeLoad: function(router) {
		router.use(function(req, res, next) {
			req.authorized = app.config.debug || (req.xhr && req.headers["x-user-accept"]);	
			next();
		});
	},

	afterLoad: function(router) {
		router.get("/*", function(req, res, next) {
			res.render("index", ViewData.getData(req));
		});
	}
};