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

			return $http.get("/api/establishment-users/auth/retrieve/").then(function(response) {
				if (response.data) {
					loggedUser = response.data;
				} else {
					loggedUser = null;
				}

				isCheckingForLoggedUser = false;
				hasCheckedForLoggedUser = true;

				return response.data;
			}, function(response) {
				loggedUser = null;

				isCheckingForLoggedUser = false;
				hasCheckedForLoggedUser = true;
			});
		};
	}]);

	module.service("OrderService", ["$http", "$q", function($http, $q) {
		this.list = function(filter) {
			if (filter) {
				if (filter.fromDate instanceof Date) {
					filter.fromDate = filter.fromDate.getTime();
				}

				if (filter.toDate instanceof Date) {
					filter.toDate = filter.toDate.getTime();
				}
			}

			return $http.get("/api/establishment/orders/", {params: filter}).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};

		this.changeStatus = function(order, status) {
			order = angular.copy(order);
			order.status = status;

			return $http.put("/api/orders/" + order.id + "/status/", order).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};
	}]);

	return module;
});