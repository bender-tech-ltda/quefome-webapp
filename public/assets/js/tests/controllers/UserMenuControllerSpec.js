"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("UserMenuController", function() {
		var scope, controller, MockedAuthService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			MockedAuthService = {
				_user: {email: "teste@teste.com"},

				isLogged: function() {
					return !!this._user;
				},

				logout: function() {
					this._user = false;
					return {
						then: function(callback) {
							callback();
						}
					};
				}
			};
		});

		beforeEach(inject(function($rootScope, $controller) {
			scope = $rootScope.$new();
			controller = $controller("UserMenuController", {"$scope": scope, Auth: MockedAuthService});
		}));

		it("should have a 'loginView' property", function() {
			expect(scope.loginView).toBeDefined();
		});

		it("should logout the current user", function() {
			scope.logout();
			expect(scope.isUserLogged()).toBe(false);
		});
	});
});