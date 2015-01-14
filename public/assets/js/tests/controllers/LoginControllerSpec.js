"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("LoginController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(inject(function($controller) {
			scope = {};
			controller = $controller("LoginController", {"$scope": scope});
		}));

		it("should not have a user logged in", function() {
			expect(scope.isLoggedIn()).toBe(false);
		});

		it("should have a user property", function() {
			expect(scope.user).not.toBeUndefined();
			expect(scope.user).not.toBeNull();
		});
			
		it("should log in the user", function() {
			scope.user = {
				username: "teste",
				password: "teste"
			};

			scope.login();

			expect(scope.isLoggedIn()).toBe(true);

			var loggedUser = scope.getLoggedUser();

			expect(loggedUser).not.toBeUndefined();
			expect(loggedUser).not.toBeNull();
		});
	});
});