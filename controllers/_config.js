var config = $require("config");

var ViewData = app.models.ViewData;

module.exports = {
	beforeLoad: function(router) {
		if (!config.env.development && config.server.forceRedirect) {
			router.use(function(req, res, next) {
				var redirect = false;
				var redirectUrl = "http://";

				if (config.server.secure && req.protocol != "https") {
					redirect = true;
					redirectUrl = "https://"; 
				}

				if (config.server.domain != req.hostname) {
					redirect = true;
					redirectUrl += config.server.domain + req.originalUrl;
				}

				if (redirect) {
					res.redirect(301, redirectUrl);
					return;
				}

				next();
			});
		}

		router.use(function(req, res, next) {
			req.authorized = config.env.development || (req.xhr && req.headers["x-user-accept"]);	
			next();
		});
	},

	afterLoad: function(router) {
		router.get("/*", function(req, res, next) {
			res.render("index", ViewData.getData(req));
		});
	}
};