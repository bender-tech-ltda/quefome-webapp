"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("AuthService", function() {
		var $httpBackend, Auth;
		var Mocked$analytics;

		beforeEach(module("qfServices"));

		beforeEach(inject(function($injector, _AuthService_, _$httpBackend_) {
			Mocked$analytics = $injector.get("$analytics");
			Mocked$analytics._setUsernameCalled = false;
			Mocked$analytics._setUsernameUsername = null;
			Mocked$analytics.setUsername = function(username) {
				this._setUsernameCalled = true;
				this._setUsernameUsername = username;
			};

			$httpBackend = _$httpBackend_;
			Auth = _AuthService_;

			var validUser = {
				email: "exemplo4@example.com",
				password: "teste",
				keepLoggedIn: false
			};

			$httpBackend.whenPOST("/api/users/auth/login/", validUser).respond(200, validUser);
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		it("should login a user with correct email and password", function() {
			Auth.login("exemplo4@example.com", "teste").then(function(user) {
				expect(Auth.isLogged()).toBe(true);
				expect(Auth.getUser()).toEqual(user);
			});

			$httpBackend.flush();
		});

		it("should keep the user logged in", function() {
			var user = {email: "exemplo4@example.com", password:"teste", keepLoggedIn: true}

			$httpBackend.expectPOST("/api/users/auth/login/", user).respond(200, user);
			Auth.login(user.email, user.password, true).then(function(user) {
				expect(Auth.isLogged()).toBe(true);
				expect(Auth.getUser()).toEqual(user);
			});

			$httpBackend.flush();
		});

		it("should not login a user with invalid email and password", function() {
			var invalidUser = {email: "exemplo5@example.com", password: "ironmansucks", keepLoggedIn: false};

			$httpBackend.expectPOST("/api/users/auth/login/", invalidUser).respond(900);
			Auth.login(invalidUser.email, invalidUser.password).then(null, function() {
				expect(Auth.isLogged()).toBe(false);
				expect(Auth.getUser()).toBeNull();
			});

			$httpBackend.flush();
		});

		it("should clear analytics identity on login", function() {
			Mocked$analytics._setUsernameCalled = false;

			Auth.login("exemplo4@example.com", "teste");
			$httpBackend.flush();

			expect(Mocked$analytics._setUsernameCalled).toBe(true);
			expect(Mocked$analytics._setUsernameUsername).toBeNull();
		});

		it("should logout the user", function() {
			Auth.login("exemplo4@example.com", "teste").then(function(user) {
				expect(Auth.isLogged()).toBe(true);
			});

			$httpBackend.flush();

			$httpBackend.expectDELETE("/api/users/auth/logout/").respond(200);
			Auth.logout().then(function() {
				expect(Auth.isLogged()).toBe(false);
			});

			$httpBackend.flush();
		});

		it("should check if a user is logged", function() {
			$httpBackend.expectGET("/api/users/auth/retrieve/").respond(200, {name: "Teste", email: "exemplo4@example.com"});
			Auth.checkForLoggedUser().then(function() {
				expect(Auth.isLogged()).toBe(true);
			});

			$httpBackend.flush();
		});

		it("should clear analytics identity for the current user", function() {
			Mocked$analytics._setUsernameCalled = false;

			$httpBackend.expectGET("/api/users/auth/retrieve/").respond(200, {name: "Teste", email: "exemplo4@example.com"});

			Auth.checkForLoggedUser();
			$httpBackend.flush();

			expect(Mocked$analytics._setUsernameCalled).toBe(true);
			expect(Mocked$analytics._setUsernameUsername).toBeNull();
		});

		//I heard you like checks, so I put a check into your check...
		describe("should check if was checked for logged user", function() {
			it("and return false if it wasn't", function() {
				expect(Auth.hasCheckedForLoggedUser()).toBe(false);	
			});

			it("and return true if it was", function() {
				$httpBackend.expectGET("/api/users/auth/retrieve/").respond(200, {name: "Teste", email: "exemplo4@example.com"});
				Auth.checkForLoggedUser().then(function() {
					expect(Auth.hasCheckedForLoggedUser()).toBe(true);
				});

				$httpBackend.flush();
			});
		});

		describe("should check if it is checking for logged user", function() {
			it("and return false if it wasn't", function() {
				expect(Auth.isCheckingForLoggedUser()).toBe(false);	
			});

			it("and return true if it was", function() {
				$httpBackend.expectGET("/api/users/auth/retrieve/").respond(200, {name: "Teste", email: "exemplo4@example.com"});
				Auth.checkForLoggedUser();
				expect(Auth.isCheckingForLoggedUser()).toBe(true);

				$httpBackend.flush();
			});
		});
	});
});