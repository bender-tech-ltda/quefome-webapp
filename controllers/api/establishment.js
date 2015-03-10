var Orders = app.models.Orders;

module.exports = function(router) {
	router.get("/api/establishment/orders/", function(req, res) {
		if (!req.session || !req.session.user || !req.session.user.establishment) {
			res.status(404).send("");
			return;
		}

		Orders.list(req.session.user.establishment).then(function(orders) {
			res.json(orders);
		}, function(response) {
			res.status(response.statusCode).send(response.body);
		});
	});
};