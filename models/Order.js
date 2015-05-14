var Q = require("q");
var webservice = $require("webservice");

var Order = function() {
	this.create = function(order) {
		return webservice.post("/orders/", order).then(function(response) {
			return response.body;
		});
	};

	this.list = function(establishment) {
		return webservice.get("/orders/", {establishment: establishment.id}).then(function(response) {
			return response.body;
		});
	};
};

module.exports = Order;