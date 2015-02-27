var EstablishmentUser = app.models.EstablishmentUser;

module.exports = function(router) {
	router.get("/api/establishment-users/auth/login/:email", function(req, res) {
		var keepLoggedIn = req.query && req.query.keepLoggedIn ? req.body.keepLoggedIn : false;

		EstablishmentUser.login(req.params.email, req.query ? req.query.password : "").then(function(establishmentUser) {
			if (typeof(establishmentUser.password) != "undefined") {
				delete(establishmentUser.password);
			}

			if (!keepLoggedIn) {
				req.session.cookie.expires = false;
				req.session.cookie.maxAge = false;
			}

			req.session.establishmentUser = establishmentUser;
			res.json(establishmentUser);
		}, function(response) {
			console.log(response);
			res.status(response.statusCode).send(response.body);
		});
	});

	router.delete("/api/establishment-users/auth/logout/", function(req, res) {
		if (req.session) {
			req.session.destroy();
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