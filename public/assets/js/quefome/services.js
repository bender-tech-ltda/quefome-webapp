define(["angular"], function(angular) {
	"use strict";
	
	var module = angular.module("qfServices", []);

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

			return $http.get("/api/users/auth/login/" + email + "/", {params: params}).then(function(response) {
				loggedUser = response.data;
				return response.data
			}, treatPromiseErrors($q));
		};

		this.logout = function() {
			return $http.delete("/api/users/auth/logout/").then(function() {
				loggedUser = null
			});
		};

		var hasCheckedForLoggedUser = false;
		this.hasCheckedForLoggedUser = function() {
			return hasCheckedForLoggedUser;
		};

		var isCheckingForLoggedUser = false;
		this.isCheckingForLoggedUser = function() {
			return isCheckingForLoggedUser;
		};

		this.checkForLoggedUser = function() {
			isCheckingForLoggedUser = true;

			return $http.get("/api/users/auth/retrieve/").then(function(response) {
				if (response.data) {
					loggedUser = response.data;
				} else {
					loggedUser = null;
				}

				isCheckingForLoggedUser = false;
				hasCheckedForLoggedUser = true;

				return response.data;
			}, function() {
				loggedUser = null;

				isCheckingForLoggedUser = false;
				hasCheckedForLoggedUser = true;
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
			}, treatPromiseErrors($q));
		};
	}]);

	module.service("ProductTypeService", ["$http", "$q", function($http, $q) {
		this.list = function() {
			return $http.get("/api/product-types/").then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};
	}]);

	module.service("EstablishmentService", ["$http", "$q", function($http, $q) {
		this.list = function(query) {
			return $http.get("/api/establishments/", {params: query}).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};
	}]);

	module.service("PaymentMethodService", ["$http", "$q", function($http, $q) {
		this.list = function() {
			return $http.get("/api/payment-methods/").then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};
	}]);

	return module;
});