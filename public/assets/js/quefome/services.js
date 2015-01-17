"use strict";

define(["angular"], function(angular) {
	var module = angular.module("qfServices", []);

	module.service("Auth", ["$http", "$q", function($http, $q) {
		var loggedUser = null;

		this.isLogged = function() {
			return !!loggedUser;
		};

		this.getUser = function() {
			return loggedUser;
		};

		this.login = function(email, password) {
			return $http.post("/api/auth/login/", {email: email, password: password}).then(function(response) {
				loggedUser = response.data;

				return response.data
			}, function(response) {
				if (response.status == 404 && typeof(response.data) === "string") {
					$q.reject(response.data);
				} else {
					$q.reject("");
				}
			});
		};

		this.logout = function() {
			return $http.post("/api/auth/logout/").then(function() {
				loggedUser = null
			});
		};

		this.checkForLoggedUser = function() {
			return $http.get("/api/auth/retrieve").then(function(response) {
				if (response.data) {
					loggedUser = response.data;
				}

				return response.data;
			});
		};
	}]);
	
	return module;
});