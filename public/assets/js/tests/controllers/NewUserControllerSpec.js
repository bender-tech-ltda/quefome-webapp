"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("NewUserController", function() {
		var scope, MockedUserService, MockedAuthService, savedUsers;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			var savedUsers = {
				"beeblebrox@gmail.com": {
					name: "Zaphod Beeblebrox",
					email: "beeblebrox@gmail.com",
					password: "imreallycrazy"
				}
			};

			MockedAuthService = {
				user: false,

				isLogged: function() {
					return !!this.user;
				}
			};

			MockedUserService = {
				save: function(user) {
					if (savedUsers[user.email]) {
						return {then: function(successCallback, failCallback) {
							if (failCallback) {
								failCallback("O email " + user.email + " já esta sendo utilizado!");
							}
						}};
					} else {
						return {then: function(successCallback, failCallback) {
							MockedAuthService.user = user;

							if (successCallback) {
								successCallback(user);
							}
						}};
					}
				}
			};

		});

		beforeEach(function () {
			return injectController("NewUserController", "views/partials/users/register.html", {UserService: MockedUserService, AuthService: MockedAuthService}, function($scope) {
				scope = $scope;

				scope.$dialog = {
					_hideCalled: false,
					hide: function() {
						this._hideCalled = true;
					}
				};
			});
		});

		var saveAndLogin = function(name, email, password) {
			scope.user.name = name;
			scope.user.email = email;
			scope.user.password = password;

			scope.$digest();

			scope.saveAndLogin();
			
			return false;
		};

		it("should have a user property", function() {
			expect(scope.user).toBeDefined();
		});

		it("should have a errorMessage property", function() {
			expect(scope.errorMessage).toBeDefined();
		});

		it("should have a loginView property", function() {
			expect(scope.loginView).toBeDefined();
		});

		describe("should show a error message", function() {
			//Arthur Dent
			it("when the name is not filled", function() {
				saveAndLogin("", "arthurdent@gmail.com", "42istheanswer");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the email is not filled", function() {
				saveAndLogin("Arthur Dent", "", "42istheanswer");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the password is not filled", function() {
				saveAndLogin("Arthur Dent", "arthurdent@gmail.com", "");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the email is invalid", function() {
				saveAndLogin("Arthur Dent", "arthurdent", "42istheanswer");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the password has less than 6 characters", function() {
				saveAndLogin("Arthur Dent", "arthurdent@gmail.com", "42");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the password has more than 20 characters", function() {
				saveAndLogin("Arthur Dent", "arthurdent@gmail.com", "42istheanswerforlifeuniverseandeverythingelse");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the email is already beeing used", function() {
				saveAndLogin("Arthur Dent", "beeblebrox@gmail.com", "42istheanswer");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});
		});

		it("should save and login the user", function() {
			saveAndLogin("Arthur Dent", "arthurdent@gmail.com", "42istheanswer");

			expect(scope.isUserLoggedIn()).toBe(true);
		});

		it("should close the current dialog", function() {
			saveAndLogin("Arthur Dent", "arthurdent@gmail.com", "42istheanswer");
			expect(scope.$dialog._hideCalled).toBe(true);
		});
	});
});