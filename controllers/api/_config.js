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
			var options = {
				url: req.params["0"],
				method: req.method,
				qs: req.query,
				body: req.body,
				headers: {}
				//response: res
			};

			if (req.headers) {
				if (req.headers.accept) {
					options.headers.accept = req.headers.accept;
				}
			}

			if (config.debug) {
				console.log(req.body);
			}

			datasource.request(options).then(function(response) {
				if (response.headers && response.headers["content-type"]) {
					res.type(response.headers["content-type"]);
				}

				res.status(response.status).send(response.body);
			}, function(response) {
				response = response ? response : {};
				res.status(response.status ? response.status : 500).send(response.body ? response.body : "");
			});
		});
	}
};