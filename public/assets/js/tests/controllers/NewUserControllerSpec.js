"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("NewUserController", function() {
		var scope;
		var MockedDialog;
		var MockedUserService, MockedAuthService;
		var savedUsers;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			var savedUsers = {
				"exemplo2@example.com": {
					name: "Zaphod Beeblebrox",
					email: "exemplo2@example.com",
					password: "imreallycrazy"
				}
			};

			MockedDialog = {
				_createdDialog: {},
				_createCalled: false,
				create: function() {
					this._createCalled = true;
					var dialog = this._createdDialog;

					return {
						then: function(callback) {
							callback(dialog);
						}
					};
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
								failCallback({
									isBusinessError: true,
									message: "O email " + user.email + " já esta sendo utilizado!"
								});
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
			var params = {
				Dialog: MockedDialog,
				UserService: MockedUserService,
				AuthService: MockedAuthService
			};
			return injectController("NewUserController", "views/partials/users/register.html", params, function($scope) {
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

		describe("should show a error message", function() {
			//Arthur Dent
			it("when the name is not filled", function() {
				saveAndLogin("", "exemplo1@example.com", "42istheanswer");

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
				saveAndLogin("Arthur Dent", "exemplo1@example.com", "");

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
				saveAndLogin("Arthur Dent", "exemplo1@example.com", "42");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the password has more than 20 characters", function() {
				saveAndLogin("Arthur Dent", "exemplo1@example.com", "42istheanswerforlifeuniverseandeverythingelse");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the email is already beeing used", function() {
				saveAndLogin("Arthur Dent", "exemplo2@example.com", "42istheanswer");

				expect(scope.isUserLoggedIn()).toBe(false);

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});
		});

		describe("when registering the user", function() {
			it("should save and login the user", function() {
				saveAndLogin("Arthur Dent", "exemplo1@example.com", "42istheanswer");

				expect(scope.isUserLoggedIn()).toBe(true);
			});

			it("should close the current dialog", function() {
				saveAndLogin("Arthur Dent", "exemplo1@example.com", "42istheanswer");
				expect(scope.$dialog._hideCalled).toBe(true);
			});

			it("should set processing to true", function() {
				scope.processing = false;
				MockedUserService.save = function() {
					return {then: function() {}};
				};

				saveAndLogin("Arthur Dent", "exemplo1@example.com", "42istheanswer");
				expect(scope.processing).toBe(true);
			});

			it("should set processing to false after finish", function() {
				scope.processing = true;
				saveAndLogin("Arthur Dent", "exemplo1@example.com", "42istheanswer");

				expect(scope.processing).toBe(false);
			});
		});

		describe("when showing the login dialog", function() {
			it("should create a dialog", function() {
				scope.showLoginDialog();
				expect(MockedDialog._createCalled).toBe(true);
			});

			it("it should pass the current dialog onResponse function", function() {
				var onResponseFunction = function() {};

				scope.$dialog = {
					onResponse: onResponseFunction,
					hide: function() {}
				};

				scope.showLoginDialog();
				expect(MockedDialog._createdDialog.onResponse).toEqual(onResponseFunction);
			});
		});
	});
});