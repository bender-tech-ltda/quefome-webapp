"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("AuthService", function() {
		var $httpBackend, Auth;

		beforeEach(module("qfAdminServices"));

		beforeEach(inject(function(_AuthService_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			Auth = _AuthService_;

			var validUser = {
				email: "teste@teste.com",
				password: "teste",
				keepLoggedIn: false
			};

			$httpBackend.whenGET("/api/establishment-users/auth/login/" + validUser.email + "/?keepLoggedIn=" + validUser.keepLoggedIn + "&password=" + validUser.password).respond(200, validUser);
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		it("should login a user with correct email and password", function() {
			Auth.login("teste@teste.com", "teste").then(function(user) {
				expect(Auth.isLogged()).toBe(true);
				expect(Auth.getUser()).toEqual(user);
			});

			$httpBackend.flush();
		});

		it("should keep the user logged in", function() {
			var user = {email: "teste@teste.com", password:"teste", keepLoggedIn: true}

			$httpBackend.expectGET("/api/establishment-users/auth/login/" + user.email + "/?keepLoggedIn=" + user.keepLoggedIn + "&password=" + user.password).respond(200, user);
			Auth.login(user.email, user.password, true).then(function(user) {
				expect(Auth.isLogged()).toBe(true);
				expect(Auth.getUser()).toEqual(user);
			});

			$httpBackend.flush();
		});

		it("should not login a user with invalid email and password", function() {
			var invalidUser = {email: "thor@gmail.com", password: "ironmansucks", keepLoggedIn: false};

			$httpBackend.expectGET("/api/establishment-users/auth/login/" + invalidUser.email + "/?keepLoggedIn=" + invalidUser.keepLoggedIn + "&password=" + invalidUser.password).respond(900);
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

			$httpBackend.expectDELETE("/api/establishment-users/auth/logout/").respond(200);
			Auth.logout().then(function() {
				expect(Auth.isLogged()).toBe(false);
			});

			$httpBackend.flush();
		});

		it("should check if a user is logged", function() {
			$httpBackend.expectGET("/api/establishment-users/auth/retrieve/").respond(200, {name: "Teste", email: "teste@teste.com"});
			Auth.checkForLoggedUser().then(function() {
				expect(Auth.isLogged()).toBe(true);
			});

			$httpBackend.flush();
		});
	});
});