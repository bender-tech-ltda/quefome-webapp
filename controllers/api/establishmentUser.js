var EstablishmentUser = app.models.EstablishmentUser;

module.exports = function(router) {
	router.get("/api/establishment-users/auth/login/:email", function(req, res) {
		if (!req.session) {
			res.status(503).send("Desculpe, não estamos conseguindo fazer login nesse momento.");
			return;
		}

		var keepLoggedIn = req.query && req.query.keepLoggedIn ? req.query.keepLoggedIn : false;

		EstablishmentUser.login(req.params.email, req.query ? req.query.password : "").then(function(establishmentUser) {
			if (typeof(establishmentUser.password) != "undefined") {
				delete(establishmentUser.password);
			}

			if (!keepLoggedIn || keepLoggedIn === "false") {
				req.session.cookie.maxAge = null;
			}

			req.session.establishmentUser = establishmentUser;
			res.json(establishmentUser);
		}, function(response) {
			res.status(response.statusCode).send(response.body);
		});
	});

	router.delete("/api/establishment-users/auth/logout/", function(req, res) {
		if (req.session) {
			if (req.session.establishmentUser) {
				delete(req.session.establishmentUser);
			}

			if (!req.session.user) {
				req.session.destroy();
			}
		}

		res.json({destroyed: true});
	});

	router.get("/api/establishment-users/auth/retrieve/", function(req, res) {
		if (req.session && req.session.establishmentUser) {
			res.json(req.session.establishmentUser);
		} else {
			res.status(900).send("Usuário não esta logado!");
		}
	});
};