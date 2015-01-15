"use strict";

define(["angular", "quefome/services", "quefome/directives"], function(angular) {
	var module = angular.module("qfControllers", ["qfServices", "qfDirectives"]);
	
	module.controller("AuthController", ["$scope", "Auth", function($scope, Auth) {
		$scope.teste = "Blablabla";

		$scope.username = "";
		$scope.password = "";

		$scope.isLogged = function() {
			return Auth.isLogged();
		};

		$scope.getUser = function() {
			return Auth.getUser();
		};

		$scope.login = function() {
			return Auth.login($scope.username, $scope.password).then(function(user) {
				$scope.password = "";

				return user;
			});
		};

		$scope.logout = function() {
			return Auth.logout();
		};
	}]);

	module.controller("HomeController", ["$scope", function($scope) {
		$scope.welcomeMessage = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	module.controller("TesteController", ["$scope", function($scope) {
		$scope.teste = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	module.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	return module;
});