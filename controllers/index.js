module.exports = function Index(router) {
	router.use("/", function(req, res) {
		res.render("index");
	});
};