"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("TesteController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			var params = {};

			return injectController("TesteController", false, params, function($scope) {
				scope = $scope;
			});
		});

		it("should have a teste property", function() {
			expect(scope.teste).toBeDefined();
		});
	});
});