define(["angular", "quefome/admin/services", "quefome/admin/directives"], function(angular) {
	"use strict";
	
	var module = angular.module("qfAdminControllers", ["qfAdminServices", "qfAdminDirectives"]);

	module.controller("LoginController", ["$scope", "AuthService", function($scope, AuthService) {
		$scope.email = "";
		$scope.password = "";
		$scope.keepLoggedIn = true;

		$scope.errorMessage = false;
		$scope.processing = false;

		$scope.isLogged = function() {
			return AuthService.isLogged();
		};

		$scope.getUser = function() {
			return AuthService.getUser();
		};

		$scope.isLoginFormValid = function() {
			if ($scope.loginForm && $scope.loginForm.$invalid) {
				if ($scope.loginForm.email.$error.required) {
					$scope.errorMessage = "Por favor, informe seu email";
				} else if ($scope.loginForm.password.$error.required) {
					$scope.errorMessage = "Por favor, informe sua senha";
				} else if ($scope.loginForm.email.$error.email) {
					$scope.errorMessage = "Por favor, informe um email válido";
				}

				return false;
			}

			$scope.errorMessage = false;

			return true;
		};

		$scope.login = function() {
			if ($scope.isLoginFormValid()) {
				$scope.processing = true;

				AuthService.login($scope.email, $scope.password, $scope.keepLoggedIn).then(function() {
					$scope.password = "";
					$scope.processing = false;

					$scope.$apply();
				}, function(error) {
					$scope.processing = false;
					$scope.errorMessage = error;

					$scope.$digest();
				});
			}
		};

		$scope.$digest();
	}]);

	module.controller("HomeController", ["$scope", function($scope) {
		
	}]);

	module.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	module.run([function() {
		
	}]);

	return module;
});