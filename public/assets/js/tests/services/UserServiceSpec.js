"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("AuthService", function() {
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

			$httpBackend.whenPUT("/api/user/saveAndLogin", user).respond(200, user);
			UserService.saveAndLogin(user).then(function(savedUser) {
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

			$httpBackend.expectPUT("/api/user/saveAndLogin", user).respond(900, "O email " + user.email + " já estando sendo utilizado");
			UserService.saveAndLogin(user).then(null, function(response) {
				expect(typeof(response)).toEqual("string");
				expect(AuthService.isLogged()).toBe(false);
			});

			$httpBackend.flush();
		});
	});
});