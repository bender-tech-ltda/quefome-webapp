
module.exports = function(router) {
	router.post("/api/auth/login/", function(req, res) {
		res.status(200).send({name: "teste", username: "teste2"});
	});

	router.post("/api/auth/logout/", function(req, res) {
		res.status(200).send("");
	});
};