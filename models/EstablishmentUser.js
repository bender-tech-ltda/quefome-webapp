var Q = require("q");
var webservice = $require("integration/webservice");

var User = function() {
	this.login = function(email, password) {
		return webservice.post("/establishment-users/auth/login/", {email: email, password: password}).then(function(response) {
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