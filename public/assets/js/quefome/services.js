define(["angular"], function(angular) {
	"use strict";
	
	var module = angular.module("qfServices", []);

	module.service("AuthService", ["$http", "$q", function($http, $q) {
		var loggedUser = null;

		this.isLogged = function() {
			return !!loggedUser;
		};

		this.getUser = function() {
			return loggedUser;
		};

		this.__setLoggedUser = function(user) {
			loggedUser = user;
		};

		this.login = function(email, password, keepLoggedIn) {
			var params = email + "/" + encodeURIComponent(password);
			var keepLoggedIn = keepLoggedIn ? keepLoggedIn : false;

			return $http.get("/api/users/auth/login/" + params, {keepLoggedIn: keepLoggedIn}).then(function(response) {
				loggedUser = response.data;
				return response.data
			}, function(response) {
				if (response.status == 900 && typeof(response.data) === "object") {
					return $q.reject(response.data.message);
				} else {
					return $q.reject(false);
				}
			});
		};

		this.logout = function() {
			return $http.delete("/api/users/auth/logout/").then(function() {
				loggedUser = null
			});
		};

		this.checkForLoggedUser = function() {
			return $http.get("/api/users/auth/retrieve/").then(function(response) {
				if (response.data) {
					loggedUser = response.data;
				}

				return response.data;
			});
		};
	}]);
	
	module.service("UserService", ["$http", "$q", "AuthService", function($http, $q, AuthService) {
		this.saveAndLogin = function(user) {
			return $http.post("/api/user/saveAndLogin", user).then(function(response) {
				var user = response.data;

				AuthService.__setLoggedUser(user);
				return user;
			}, function(response) {
				if (response.status == 900 && typeof(response.data) === "string") {
					return $q.reject(response.data);
				} else {
					return $q.reject(false);
				}
			});
		};
	}]);

	return module;
});