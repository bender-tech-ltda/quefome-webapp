var Q = require("q");
var webservice = $require("webservice");

var Order = function() {
	this.list = function(establishment) {
		return webservice.get("/orders/list/", {establishment: establishment.id}).then(function(response) {
			return response.body;
		});
	};
};

module.exports = Order;