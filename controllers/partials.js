var path = require("path");

module.exports = function Partials(router) {
	router.get("/partials/*", function(req, res) {
		if (!req.authorized) {
			res.send(404);
			return;
		}

		var viewFile = req.params["0"].split(".");
		viewFile = viewFile[0];
		viewFile = viewFile.replace(new RegExp("/*$"), "");
		res.render(path.join("partials", viewFile));
	});
};