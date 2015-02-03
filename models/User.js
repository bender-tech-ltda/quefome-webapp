var Q = require("q");
var webservice = $require("webservice");

var User = function() {
	
	this.save = function(user) {
		return webservice.post("/users/", user).then(function(response) {
			return response.body;
		});
	};

	this.login = function(email, password) {
		return webservice.get("/users/auth/login/" + email + "/", {password: password}).then(function(response) {
			var user = response.body;

			if (!user) {
				return Q.reject(response);
			} else {
				return user;
			}
		});
	};
};

module.exports = User;