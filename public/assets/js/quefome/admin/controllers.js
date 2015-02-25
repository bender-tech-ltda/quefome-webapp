define(["angular", "quefome/admin/services", "quefome/admin/directives"], function(angular) {
	"use strict";
	
	var module = angular.module("qfAdminControllers", ["qfAdminServices", "qfAdminDirectives"]);

	module.controller("HomeController", ["$scope", function($scope) {
		
	}]);

	module.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	return module;
});