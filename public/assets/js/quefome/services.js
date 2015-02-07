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
			var params = {
				password: password,
				keepLoggedIn: keepLoggedIn ? keepLoggedIn : false
			};

			return $http.get("/api/users/auth/login/" + email + "/", {params: params}).then(function(response) {
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
		this.save = function(user, login) {
			var params = {
				login: login
			};

			return $http.post("/api/users/", user, {params: params}).then(function(response) {
				var user = response.data;

				AuthService.__setLoggedUser(user);
				return user;
			}, function(response) {
				if (response.status == 900 && typeof(response.data) === "object") {
					return $q.reject(response.data.message);
				} else {
					return $q.reject(false);
				}
			});
		};
	}]);

	module.service("ProductTypeService", ["$http", "$q", function($http, $q) {
		this.list = function() {
			return $http.get("/api/product-types/").then(function(response) {
				return response.data;
			}, function(response) {
				if (response.status == 900 && typeof(response.data) === "object") {
					return $q.reject(response.data.message);
				} else {
					return $q.reject(false);
				}
			});
			/*
			var deferred = $q.defer();

			setTimeout(function() {
				deferred.resolve([
					{name: "Pizza"},
					{name: "Comida Japonesa"},
					{name: "Pastel"},
					{name: "Xis"},
					{name: "Comida Chinesa"},
					{name: "Comida Vegana"},
					{name: "Comida espacial"},
					{name: "Frutos do mar"}
				]);
			}, 1);

			return deferred.promise;
			*/
		};
	}]);

	return module;
});