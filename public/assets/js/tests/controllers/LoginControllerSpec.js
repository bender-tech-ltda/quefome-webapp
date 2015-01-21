"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("LoginController", function() {
		var scope, controller, MockedAuthService;

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

		/**
		beforeEach(inject(function($templateCache, $rootScope, $compile, $controller) {
			scope = $rootScope.$new();
			controller = $controller("LoginController", {"$scope": scope, Auth: MockedAuthService});

			var view = angular.element($templateCache.get("/partials/users/login-form.html"));
			console.log(view);
			view.find("[ng-controller='LoginController']").removeAttrs("ng-controller");

			$compile(view)(scope);
			scope.$digest();
		}));
**/
		beforeEach(function() {
			return injectController("LoginController", "/base/views/partials/users/login-form.html", {Auth: MockedAuthService}, function($scope) {
				scope = $scope;
			})
		});

		var login = function() {
			scope.email = "teste@teste.com";
			scope.password = "teste";

			scope.$digest();

			scope.login();
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

		it("should login the user", function() {
			login();

			expect(scope.isLogged()).toBe(true);
			expect(scope.getUser()).toBeDefined();
		});

		it("should clear the password property after login for security", function() {
			login();

			expect(scope.password.trim()).toBe("");
		});

		it("should keep the user logged in", function() {
			scope.keepLoggedIn = true;
			login();

			expect(scope.isLogged()).toBe(true);
			expect(scope.getUser().keepLoggedIn).toBe(true);
		});
	});
});