var Address = app.models.Address;

module.exports = function(router) {
	router.get("/api/addresses/search/zip-code/:zipCode", function(req, res) {
		Address.searchZipCode(req.params.zipCode).then(function(address) {
			res.json(address);
		}, function(response) {
			res.status(response.statusCode).send(response.body);
		});
	});

	router.get("/api/addresses/search/address/:state/:city/:address", function(req, res) {
		var address = {
			address: req.params.address,
			city: {
				name: req.params.city,
				state: {
					acronym: req.params.state
				}
			}
		};

		Address.searchAddress(address).then(function(address) {
			res.json(address);
		}, function(response) {
			res.status(response.statusCode).send(response.body);
		});
	});
};