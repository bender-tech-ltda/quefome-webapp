var Q = require("q");
var datasource = $require("datasource");

var User = function() {
	
	this.save = function(user) {
		return datasource.get("/users/list", {email: user.email}).then(function(list) {
			console.log(list);

			if (list && list.body && list.body.length > 0) {
				return Q.reject("O email " + user.email + " já esta sendo utilizado.")
			}

			return datasource.post("/users/create", user).then(function(response) {
				var user = response.body;

				if (!user) {
					return Q.reject(response);
				} else {
					return user;
				}
			});
		});
	};
};

module.exports = User;