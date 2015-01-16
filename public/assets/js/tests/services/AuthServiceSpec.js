"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("AuthService", function() {
		var $httpBackend, Auth;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_Auth_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			Auth = _Auth_;

			var validUser = {
				email: "teste@teste.com",
				password: "teste"
			};

			$httpBackend.whenPOST("/api/auth/login/", validUser).respond(200, validUser);
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		it("should login a user with correct username and password", function() {
			Auth.login("teste@teste.com", "teste").then(function(user) {
				expect(Auth.isLogged()).toBe(true);
				expect(Auth.getUser()).toEqual(user);
			});

			$httpBackend.flush();
		});

		it("should not login a user with invalid username and password", function() {
			var invalidUser = {email: "thor@gmail.com", password: "ironmansucks"};

			$httpBackend.expectPOST("/api/auth/login/", invalidUser).respond(404);
			Auth.login(invalidUser.email, invalidUser.password).then(null, function() {
				expect(Auth.isLogged()).toBe(false);
				expect(Auth.getUser()).toBeNull();
			});

			$httpBackend.flush();
		});

		it("should logout the user", function() {
			Auth.login("teste@teste.com", "teste").then(function(user) {
				expect(Auth.isLogged()).toBe(true);
			});

			$httpBackend.flush();

			$httpBackend.expectPOST("/api/auth/logout/").respond(200);
			Auth.logout().then(function() {
				expect(Auth.isLogged()).toBe(false);
			});

			$httpBackend.flush();
		});
	});
});