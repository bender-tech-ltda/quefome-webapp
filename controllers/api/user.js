var User = app.models.User;

module.exports = function(router) {
	router.post("/api/users/", function(req, res) {
		var user = req.body;

		User.save(user).then(function(user) {
			delete(user.password);

			if (req.query && req.query.login) {
				req.session.user = user;	
			}
			
			res.json(user);
		}, function(response) {
			res.status(response.status).send(response.body);
		});
	});

	router.get("/api/users/auth/login/:email", function(req, res) {
		var keepLoggedIn = req.query && req.query.keepLoggedIn ? req.body.keepLoggedIn : false;

		User.login(req.params.email, req.query ? req.query.password : "").then(function(user) {
			delete(user.password);

			if (!keepLoggedIn) {
				req.session.cookie.expires = false;
				req.session.cookie.maxAge = false;
			}

			req.session.user = user;

			res.json(user);
		}, function(response) {
			console.log(response);
			res.status(response.status).send(response.body);
		});
	});

	router.delete("/api/users/auth/logout/", function(req, res) {
		if (req.session) {
			req.session.destroy();
		}

		res.json({destroyed: true});
	});

	router.get("/api/users/auth/retrieve/", function(req, res) {
		if (req.session && req.session.user) {
			res.json(req.session.user);
		} else {
			res.status(900).send("Usuário não esta logado!");
		}
	});
};