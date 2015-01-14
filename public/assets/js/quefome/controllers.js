"use strict";

define(["angular", "quefome/directives"], function(angular) {
	var quefome = angular.module("qfControllers", ["qfDirectives"]);
	
	quefome.controller("LoginController", ["$scope", function($scope) {
		$scope.teste = "Blablabla";

		$scope.user = {};
		$scope.loggedUser = null;

		$scope.isLoggedIn = function() {
			return !!$scope.loggedUser;
		};

		$scope.getLoggedUser = function() {
			return $scope.loggedUser;
		};

		$scope.login = function() {
			$scope.loggedUser = angular.copy($scope.user);
		};
	}]);

	quefome.controller("HomeController", ["$scope", function($scope) {
		$scope.welcomeMessage = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	quefome.controller("TesteController", ["$scope", function($scope) {
		$scope.teste = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	quefome.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	return quefome;
});