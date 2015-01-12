var path = require("path");

module.exports = function Index(router) {
	router.get("/partials/*", function(req, res) {
		console.log("Pudim");

		if (!app.config.debug && !req.xhr) {
			res.send(404);
			return;
		}

		var viewFile = req.params["0"].split(".");
		viewFile = viewFile[0];
		viewFile = viewFile.replace(new RegExp("/*$"), "");
		res.render(path.join("partials", viewFile));
	});
};