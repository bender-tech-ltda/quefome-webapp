module.exports = function Index(router) {
	router.get("/admin/", function(req, res) {
		res.render("admin/index", {title: "Quefo.me - Acesso Delivery"});
	});
};