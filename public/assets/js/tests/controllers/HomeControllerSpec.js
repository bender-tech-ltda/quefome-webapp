"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("HomeController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(inject(function($controller) {
			scope = {};
			controller = $controller("HomeController", {"$scope": scope});
		}));

		it("should have a welcomeMessage property", function() {
			expect(scope.welcomeMessage).toBeDefined();
		});
	});
});