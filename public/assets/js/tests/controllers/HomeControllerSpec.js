"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("HomeController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(inject(function($rootScope, $controller) {
			scope = $rootScope.$new();
			controller = $controller("HomeController", {"$scope": scope});
		}));

		it("should have a productTypes property", function() {
			expect(scope.productTypes).toBeDefined();
		});
	});
});