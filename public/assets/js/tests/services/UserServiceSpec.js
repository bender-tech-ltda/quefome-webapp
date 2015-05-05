"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("UserService", function() {
		var $httpBackend, UserService, AuthService;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_UserService_, _AuthService_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			UserService = _UserService_;
			AuthService = _AuthService_;
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		it("should save and login a user", function() {
			var user = {
				name: "Arthur Dent",
				email: "arthurdent@gmail.com",
				password: "42istheanswer"
			};

			$httpBackend.whenPOST("/api/users/", user).respond(200, user);
			UserService.save(user).then(function(savedUser) {
				expect(savedUser).toEqual(user);
				expect(AuthService.isLogged()).toBe(true);
			});

			$httpBackend.flush();
		});

		it("should not save a user with an email address beeing used by another user", function() {
			var user = {
				name: "Zaphod Beeblebrox",
				email: "beeblebrox@gmail.com",
				password: "imreallycrazy"
			};

			$httpBackend.whenPOST("/api/users/", user).respond(900, {message: "O email " + user.email + " já estando sendo utilizado"});
			UserService.save(user).then(null, function(response) {
				expect(response.isBusinessError).toBe(true);
				expect(AuthService.isLogged()).toBe(false);
			});

			$httpBackend.flush();
		});
	});
});