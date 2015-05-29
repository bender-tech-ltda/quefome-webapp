var Q = require("q");
var webservice = $require("webservice");

var Order = function() {
	this.create = function(order) {
		return webservice.post("/orders/", order).then(function(response) {
			return response.body;
		});
	};

	this.list = function(filter) {
		if (!filter) {
			filter = {};
		}

		if (filter.establishment && typeof(filter.establishment) === "object") {
			filter.establishment = filter.establishment.id;
		}

		if (filter.user && typeof(filter.user) === "object") {
			filter.user = filter.user.id;
		}

		return webservice.get("/orders/", filter).then(function(response) {
			return response.body;
		});
	};
};

module.exports = Order;