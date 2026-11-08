var EstablishmentUser = app.models.EstablishmentUser;

module.exports = function(router) {
	router.post("/api/establishment-users/auth/login/", function(req, res) {
		if (!req.session) {
			res.status(503).send("Desculpe, não estamos conseguindo fazer login nesse momento.");
			return;
		}

		var keepLoggedIn = req.body && req.body.keepLoggedIn ? req.body.keepLoggedIn : false;

		EstablishmentUser.login(req.body ? req.body.email : "", req.body ? req.body.password : "").then(function(establishmentUser) {
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

	// Retired credential-bearing URLs must not reach the generic API proxy.
	router.all("/api/establishment-users/auth/login/:email?", function(req, res) {
		res.set("Allow", "POST");
		res.status(405).send("Use POST with credentials in the request body.");
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