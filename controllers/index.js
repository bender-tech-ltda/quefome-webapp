module.exports = function Index(router) {
	router.get("/", function(req, res) {
		res.render("index", {title: "Fuck"});
	});
};