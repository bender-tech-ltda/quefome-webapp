"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("UserMenuController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			
		});

		beforeEach(inject(function($rootScope, $controller) {
			scope = $rootScope.$new();
			controller = $controller("UserMenuController", {"$scope": scope});
		}));

		it("should have a 'loginView' property", function() {
			expect(scope.loginView).toBeDefined();
		});
	});
});