"use strict";

define(["angular"], function(angular) {
	var quefome = angular.module("qfControllers", []);
	
	quefome.controller("HomeController", ["$scope", function($scope) {
		$scope.welcomeMessage = "Olá, seja bem vindo ao Quefo.me!";

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

	quefome.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	return quefome;
});