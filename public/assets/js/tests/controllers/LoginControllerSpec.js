"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("LoginController", function() {
		var scope, MockedAuthService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			MockedAuthService = {
				_user: false,

				isLogged: function() {
					return !!this._user;
				},

				login: function(email, password, keepLoggedIn) {
					if (email == "teste@teste.com" && password == "teste") {
						this._user = {
							email: email,
							password: password,
							keepLoggedIn: keepLoggedIn
						};
					}

					var user = this._user;

					return {
						then: function(success, fail) {
							if (user) {
								success(user);
							} else {
								fail();
							}
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

		beforeEach(function() {
			return injectController("LoginController", "views/partials/login/login.html", {AuthService: MockedAuthService}, function($scope) {
				scope = $scope;
			})
		});

		var login = function(email, password) {
			scope.email = email;
			scope.password = password;

			scope.$digest();

			scope.login();
		};

		var defaultLogin = function() {
			login("teste@teste.com", "teste");
		};

		it("should not have a user logged in", function() {
			expect(scope.isLogged()).toBe(false);
		});
		
		it("should have a email property", function() {
			expect(scope.email).toBeDefined();
		});

		it("should have a password property", function() {
			expect(scope.password).toBeDefined();
		});

		it("should have a keepLoggedIn property", function() {
			expect(scope.keepLoggedIn).toBeDefined();
		});

		it("should have a errorMessage property", function() {
			expect(scope.errorMessage).toBeDefined();
		});

		it("should have a registerView property", function() {
			expect(scope.registerView).toBeDefined();
		});

		it("should show a error message when the email is not filled", function() {
			login("", "teste");

			expect(scope.isLogged()).toBe(false);

			expect(typeof(scope.errorMessage)).toEqual("string");
			expect(scope.errorMessage.length).toBeGreaterThan(0);
		});

		it("should show a error message when the password is not filled", function() {
			login("teste@teste.com");

			expect(scope.isLogged()).toBe(false);

			expect(typeof(scope.errorMessage)).toEqual("string");
			expect(scope.errorMessage.length).toBeGreaterThan(0);
		});

		it("should show a error message when the email is invalid", function() {
			login("teste", "teste");

			expect(scope.isLogged()).toBe(false);

			expect(typeof(scope.errorMessage)).toEqual("string");
			expect(scope.errorMessage.length).toBeGreaterThan(0);
		});

		it("should login the user", function() {
			defaultLogin();

			expect(scope.isLogged()).toBe(true);
			expect(scope.getUser()).toBeDefined();
		});

		it("should clear the password property after login for security", function() {
			defaultLogin();

			expect(scope.password.trim()).toBe("");
		});

		it("should keep the user logged in", function() {
			scope.keepLoggedIn = true;
			defaultLogin();

			expect(scope.isLogged()).toBe(true);
			expect(scope.getUser().keepLoggedIn).toBe(true);
		});
	});
});