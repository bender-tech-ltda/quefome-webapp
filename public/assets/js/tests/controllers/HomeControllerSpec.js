"use strict";

define(["angular", "angular/mock"], function(angular) {

	describe("quefome", function() {
		var $controller = null;

		beforeEach(module("quefome"));
		beforeEach(inject(function(_$controller_) {
			$controller = _$controller_;
		}));

		describe("HomeController", function() {
			var $scope = null, controller = null;

			beforeEach(function() {
				$scope = {};
				controller = $controller("HomeController", {"$scope": $scope});
			});

			it("should not have a user logged in", function() {
				expect($scope.isLoggedIn()).toBe(false);
			});

			it("should have a user property", function() {
				expect($scope.user).not.toBeUndefined();
				expect($scope.user).not.toBeNull();
			});
			
			it("should log in the user", function() {
				$scope.user = {
					username: "teste",
					password: "teste"
				};

				$scope.login();

				expect($scope.isLoggedIn()).toBe(true);

				var loggedUser = $scope.getLoggedUser();

				expect(loggedUser).not.toBeUndefined();
				expect(loggedUser).not.toBeNull();
			});
		});
	});
});