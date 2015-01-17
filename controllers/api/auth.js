var datasource = $require("datasource");

module.exports = function(router) {
	router.post("/api/auth/login/", function(req, res) {
		datasource.get("/users/list/", {email: req.body.email, password: req.body.password}).then(function(response) {
			var user = response.body && response.body[0] ? response.body[0] : false;

			if (user) {
				delete(user.password);
				req.session.user = user;

				res.json(user);
			} else {
				res.status(404).send("Usuário e senha inválidos.");
			}
		}, function() {
			res.status(404).send("Usuário e senha inválidos.");
		});
	});

	router.post("/api/auth/logout/", function(req, res) {
		if (req.session) {
			req.session.destroy();
		}

		res.json({destroyed: true});
	});

	router.get("/api/auth/retrieve/", function(req, res) {
		if (req.session && req.session.user) {
			res.json(req.session.user);
		} else {
			res.status(404).send("");
		}
	});
};