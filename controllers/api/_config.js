var config = $require("config");
var datasource = $require("datasource");

module.exports = {
	beforeLoad: function(router) {
		router.use("/api/*", function(req, res, next) {
			if (!config.debug && !req.xhr) {
				res.status(404);
				return;
			}

			next();
		});
	},

	afterLoad: function(router) {
		router.use("/api/*", function(req, res) {
			console.log(req.headers);

			var options = {
				method: req.method,
				qs: req.query,
				body: req.body,
				//headers: req.headers
				//response: res
			};

			if (config.debug) {
				console.log(req.body);
			}

			datasource.request(req.params["0"], options).fin(function(response) {
				if (response.headers && response.headers["content-type"]) {
					res.type(response.headers["content-type"]);
				}

				res.status(response.status).send(response.body);
			});
		});
	}
};