"use strict";

define(["angular"], function(angular) {
	var module = angular.module("qfServices", []);

	module.service("Auth", ["$http", function($http) {
		this.isLogged = function() {
			return false;
		};

		this.login = function(username, password) {
			return $http.post("/api/auth/login/", {username: username, password: password});
		};
	}]);
	
	return module;
});