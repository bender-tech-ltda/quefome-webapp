var datasource = $require("datasource");

module.exports = function(router) {
	router.post("/api/auth/login/", function(req, res) {
		datasource.get("/users/list/", {email: req.body.email, password: req.body.password}).then(function(response) {
			console.log(response);

			var user = response.body && response.body[0] ? response.body[0] : false;

			if (user) {
				delete(user.password);
				res.status(200).send(user);
			} else {
				res.status(404).send("Usuário e senha inválidos.");
			}
		}, function() {
			res.status(404).send("Usuário e senha inválidos.");
		});
	});

	router.post("/api/auth/logout/", function(req, res) {
		res.status(200).send("");
	});
};