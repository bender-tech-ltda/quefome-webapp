define(["angular"], function(angular) {
	"use strict";
	
	var module = angular.module("qfAdminServices", []);

	var treatPromiseErrors = function($q) {
		return function(response) {
			if (response.status == 900 && typeof(response.data) === "object") {
				return $q.reject(response.data.message);
			} else {
				return $q.reject(false);
			}
		};
	};

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
			var params = {
				password: password,
				keepLoggedIn: keepLoggedIn ? keepLoggedIn : false
			};

			return $http.get("/api/establishment-users/auth/login/" + email + "/", {params: params}).then(function(response) {
				loggedUser = response.data;
				return response.data
			}, treatPromiseErrors($q));
		};

		this.logout = function() {
			return $http.delete("/api/establishment-users/auth/logout/").then(function() {
				loggedUser = null
			});
		};

		this.checkForLoggedUser = function() {
			return $http.get("/api/establishment-users/auth/retrieve/").then(function(response) {
				if (response.data) {
					loggedUser = response.data;
				}

				return response.data;
			});
		};
	}]);

	return module;
});