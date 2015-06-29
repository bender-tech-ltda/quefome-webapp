module.exports = {
	afterLoad: function(router) {
		router.get(["/admin", "/admin/*"], function(req, res) {
			res.render("admin/index", {title: "Quefo.me - Acesso Delivery"});
		});
	}
};