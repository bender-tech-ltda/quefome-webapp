var config = $require("config");

var User = app.models.User;
var Order = app.models.Order;

module.exports = function(router) {
	router.post("/api/users/", function(req, res) {
		if (!req.session) {
			res.status(503).send("Desculpe, não estamos conseguindo fazer cadastros nesse momento.");
			return;
		}

		var user = req.body;

		User.save(user).then(function(user) {
			if (typeof(user.password) != "undefined") {
				delete(user.password);
			}

			if (req.query && req.query.login) {
				req.session.user = user;	
			}
			
			res.json(user);
		}, function(response) {
			res.status(response.statusCode).send(response.body);
		});
	});

	router.get("/api/users/auth/login/:email", function(req, res) {
		if (!req.session) {
			res.status(503).send("Desculpe, não estamos conseguindo fazer login nesse momento.");
			return;
		}

		var keepLoggedIn = req.query && req.query.keepLoggedIn ? req.query.keepLoggedIn : false;

		User.login(req.params.email, req.query ? req.query.password : "").then(function(user) {
			if (typeof(user.password) != "undefined") {
				delete(user.password);
			}

			if (!keepLoggedIn || keepLoggedIn === "false") {
				req.session.cookie.maxAge = null;
			}

			req.session.user = user;
			res.json(user);
		}, function(response) {
			res.status(response.statusCode).send(response.body);
		});
	});

	router.delete("/api/users/auth/logout/", function(req, res) {
		if (req.session) {
			if (req.session.user) {
				delete(req.session.user);
			}

			if (!req.session.establishmentUser) {
				req.session.destroy();
			}
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

	router.get("/api/user/orders/", function(req, res) {
		if (req.session && req.session.user) {
			var filter = req.query || {};
			filter.user = req.session.user;

			if (typeof(filter.lastHours) === "undefined") {
				filter.lastHours = 24;
			}

			if (typeof(filter.status) === "undefined") {
				filter.status = null; //trazer pedidos com qualquer status
			}

			Order.list(filter).then(function(orders) {
				res.json(orders);
			}, function(response) {
				res.status(response.statusCode).send(response.body);
			});
		} else {
			res.status(900).send("Usuário não esta logado!");
		}
	});

	router.post("/api/user/orders/", function(req, res) {
		if (req.session && req.session.user) {
			req.body.user = req.session.user;

			Order.create(req.body).then(function(order) {
				res.json(order);
			}, function(response) {
				res.status(response.statusCode).send(response.body);
			});
		} else {
			res.status(900).send("Usuário não esta logado!");
		}
	});
};