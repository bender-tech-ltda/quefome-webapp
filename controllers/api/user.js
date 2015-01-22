var User = app.models.User;

module.exports = function(router) {
	router.post("/api/user/saveAndLogin/", function(req, res) {
		var user = req.body;

		User.save(user).then(function(user) {
			delete(user.password);

			req.session.user = user;
			res.json(user);
		}, function(response) {
			if (typeof(response) === "object") {
				res.status(response.status).send(response.body);
			} else {
				res.status(900).send("O email " + user.email + " já esta sendo utilizado");
			}
		});
	});
};