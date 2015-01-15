"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("AuthController", function() {
		var scope, controller, MockedAuthService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			MockedAuthService = {
				_user: false,

				isLogged: function() {
					return !!this._user;
				},

				login: function(username, password) {
					if (username == "teste" && password == "teste") {
						this._user = {
							username: username,
							password: password
						};
					}

					return {
						then: function(callback) {
							callback(this._user);
						}
					};
				},

				logout: function() {
					this._user = false;
				},

				getUser: function() {
					return this._user;
				}
			};
		});

		beforeEach(inject(function($rootScope, $controller) {
			scope = $rootScope.$new();
			controller = $controller("AuthController", {"$scope": scope, Auth: MockedAuthService});
		}));

		var login = function() {
			scope.username = "teste";
			scope.password = "teste";

			return scope.login();
		};

		it("should not have a user logged in", function() {
			expect(scope.isLogged()).toBe(false);
		});
		
		it("should have a username property", function() {
			expect(scope.username).toBeDefined();
		});

		it("should have a passowrd property", function() {
			expect(scope.password).toBeDefined();
		});

		it("should login the user", function() {
			login();

			expect(scope.isLogged()).toBe(true);
			expect(scope.getUser()).toBeDefined();
		});

		it("should clear the password property after login for security", function() {
			login();

			expect(scope.password.trim()).toBe("");
		});

		it("should logout the user", function() {
			login();
			expect(scope.isLogged()).toBe(true);

			scope.logout();
			expect(scope.isLogged()).toBe(false);
		});
	});
});