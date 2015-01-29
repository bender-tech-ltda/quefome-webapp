var User = app.models.User;

module.exports = function(router) {
	router.post("/api/user/saveAndLogin/", function(req, res) {
		var user = req.body;

		User.save(user).then(function(user) {
			delete(user.password);

			req.session.user = user;
			res.json(user);
		}, function(response) {
			res.status(response.status).send(response.body);
		});
	});
};