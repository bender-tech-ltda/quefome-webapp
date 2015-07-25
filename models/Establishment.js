var webservice = $require("webservice");

var Establishment = function() {
	this.list = function() {
		return webservice.get("/establishments/").then(function(response) {
			return response.body;
		});
	};
};

module.exports = Establishment;