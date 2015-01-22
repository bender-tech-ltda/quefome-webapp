"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("NewUserController", function() {
		var scope;

		beforeEach(module("qfControllers"));

		beforeEach(injectController("NewUserController", "views/partials/users/register-form.html", {}, function($scope) {
			scope = $scope;
		}));

		var register = function(name, email, password) {
			scope.user.name = name;
			scope.user.email = email;
			scope.user.password = password;

			scope.$digest();

			scope.register();
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
				register("", "arthurdent@gmail.com", "42istheanswer");

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the email is not filled", function() {
				register("Arthur Dent", "", "42istheanswer");

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the password is not filled", function() {
				register("Arthur Dent", "arthurdent@gmail.com", "");

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the email is invalid", function() {
				register("Arthur Dent", "arthurdent", "42istheanswer");

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the password has less than 6 characters", function() {
				register("Arthur Dent", "arthurdent@gmail.com", "42");

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});

			it("when the password has more than 20 characters", function() {
				register("Arthur Dent", "arthurdent@gmail.com", "42istheanswerforlifeuniverseandeverythingelse");

				expect(typeof(scope.errorMessage)).toEqual("string");
				expect(scope.errorMessage.length).toBeGreaterThan(0);
			});
		});
	});
});