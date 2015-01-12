"use strict";

define(["angular"], function(angular) {
	var quefome = angular.module("qfControllers", []);
	
	quefome.controller("HomeController", ["$scope", function($scope) {
		$scope.welcomeMessage = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	quefome.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	return quefome;
});