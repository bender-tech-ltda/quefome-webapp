var Order = app.models.Order;

module.exports = function(router) {
	router.get("/api/establishment/orders/", function(req, res) {
		if (!req.session || !req.session.establishmentUser || !req.session.establishmentUser.establishment) {
			res.status(404).send("");
			return;
		}

		console.log(req.session.establishmentUser);

		Order.list(req.session.establishmentUser.establishment).then(function(orders) {
			res.json(orders);
		}, function(response) {
			res.status(response.statusCode).send(response.body);
		});
	});
};