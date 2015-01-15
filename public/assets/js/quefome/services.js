"use strict";

define(["angular"], function(angular) {
	var module = angular.module("qfServices", []);

	module.service("Auth", ["$http", function($http) {
		var loggedUser = null;

		this.isLogged = function() {
			return !!loggedUser;
		};

		this.getUser = function() {
			return loggedUser;
		};

		this.login = function(username, password) {
			return $http.post("/api/auth/login/", {username: username, password: password}).then(function(response) {
				loggedUser = response.data;

				return response.data
			});
		};

		this.logout = function() {
			return $http.post("/api/auth/logout/").then(function() {
				loggedUser = null
			});
		};
	}]);
	
	return module;
});