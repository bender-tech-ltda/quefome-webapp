var Q = require("q");
var datasource = $require("datasource");

var Auth = function() {
	
	this.login = function(email, password) {
		return datasource.get("/users/list/", {email: email, password: password}).then(function(response) {
			var user = response.body && response.body[0] ? response.body[0] : false;

			if (!user) {
				return Q.reject(response);
			} else {
				return user;
			}
		});
	};
};

module.exports = Auth;