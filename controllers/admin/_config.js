var config = $require("config");

module.exports = {
	afterLoad: function(router) {
		router.get(["/admin", "/admin/*"], function(req, res) {
			res.render("admin/index", config.view);
		});
	}
};