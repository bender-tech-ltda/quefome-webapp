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

		this.login = function(email, password, keepLoggedIn) {
			var userData = {
				email: email,
				password: password,
				keepLoggedIn: keepLoggedIn ? keepLoggedIn : false
			};

			return $http.post("/api/auth/login/", userData).then(function(response) {
				loggedUser = response.data;

				return response.data
			}, function(response) {
				if (response.status == 404 && typeof(response.data) === "string") {
					return $q.reject(response.data);
				} else {
					return $q.reject(false);
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