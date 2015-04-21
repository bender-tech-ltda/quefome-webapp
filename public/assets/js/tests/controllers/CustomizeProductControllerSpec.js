"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("CustomizeProductController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			var params = {};

			return injectController("CustomizeProductController", false, params, function($scope) {
				scope = $scope;
			});
		});
	});
});