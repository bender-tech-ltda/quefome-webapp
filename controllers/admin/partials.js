var path = require("path");

module.exports = function Partials(router) {
	router.get("/admin/partials/*", function(req, res) {
		if (!app.config.debug && !req.xhr) {
			res.send(404);
			return;
		}

		var viewFile = req.params["0"].split(".");
		viewFile = viewFile[0];
		viewFile = viewFile.replace(new RegExp("/*$"), "");
		res.render(path.join("admin", "partials", viewFile));
	});
};