var webservice = $require("integration/webservice");

var ProductType = function() {
	this.list = function() {
		return webservice.get("/product-types/").then(function(response) {
			return response.body;
		});
	};
};

module.exports = ProductType;