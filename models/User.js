var Q = require("q");
var webservice = $require("webservice");

var User = function() {
	
	this.save = function(user) {
		return webservice.post("/users/", user).then(function(response) {
			return response.body;
		});
	};
};

module.exports = User;