var Address = app.models.Address;

module.exports = function(router) {
	router.get("/api/addresses/search/zip-code/:zipCode", function(req, res) {
		Address.searchZipCode(req.params.zipCode).then(function(address) {
			res.json(address);
		}, function(response) {
			res.status(response.statusCode).send(response.body);
		});
	});
};