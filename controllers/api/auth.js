var Auth = app.models.Auth;

module.exports = function(router) {
	router.post("/api/auth/login/", function(req, res) {
		Auth.login(req.body.email, req.body.password).then(function(user) {
			delete(user.password);
			req.session.user = user;

			res.json(user);
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