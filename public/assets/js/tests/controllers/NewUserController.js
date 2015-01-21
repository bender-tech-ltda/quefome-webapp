/**
"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("NewUserController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(inject(function($rootScope, $controller) {
			scope = $rootScope.$new();
			controller = $controller("NewUserController", {"$scope": scope});
		}));

		it("should have a user property", function() {
			expect(scope.user).toBeDefined();
		});
	});
});
**/