var Q = require("q");
var webservice = $require("webservice");

var Order = function() {
	this.list = function(establishment) {
		return webservice.get("/orders/", {establishment: establishment.id}).then(function(response) {
			return response.body;
		});
	};
};

module.exports = Order;