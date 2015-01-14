"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("TesteController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(inject(function($controller) {
			scope = {};
			controller = $controller("TesteController", {"$scope": scope});
		}));

		it("should have a teste property", function() {
			expect(scope.teste).toBeDefined();
		});
	});
});