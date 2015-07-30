var ViewData = app.models.ViewData;

module.exports = {
	afterLoad: function(router) {
		router.get(["/admin", "/admin/*"], function(req, res) {
			res.render("admin/index", ViewData.getData(req));
		});
	}
};