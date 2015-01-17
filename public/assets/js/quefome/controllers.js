"use strict";

define(["angular", "quefome/services", "quefome/directives"], function(angular) {
	var module = angular.module("qfControllers", ["qfServices", "qfDirectives"]);

	module.controller("UserMenuController", ["$scope", "Auth", function($scope, Auth) {
		$scope.loginView = "/partials/login/login";

		$scope.logout = function() {
			Auth.logout().then(function() {
				$scope.$apply();
			});
		};

		$scope.isUserLogged = function() {
			return Auth.isLogged();
		};
	}]);
	
	module.controller("LoginController", ["$scope", "Auth", function($scope, Auth) {
		$scope.email = "";
		$scope.password = "";
		$scope.keepLoggedIn = false;

		$scope.processing = false;
		$scope.errorMessage = false;

		$scope.isLogged = function() {
			return Auth.isLogged();
		};

		$scope.getUser = function() {
			return Auth.getUser();
		};

		$scope.isLoginFormValid = function() {
			if ($scope.form && $scope.form.$invalid) {
				if ($scope.form.email.$error.required) {
					$scope.errorMessage = "Por favor, informe seu email";
				} else if ($scope.form.password.$error.required) {
					$scope.errorMessage = "Por favor, informe sua senha";
				} else if ($scope.form.email.$error.email) {
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

				return Auth.login($scope.email, $scope.password, $scope.keepLoggedIn).then(function(user) {
					$scope.password = "";
					$scope.processing = false;

					$scope.$apply();

					if ($scope.$parent.$dialog) {
						$scope.$parent.$dialog.close();
					}
				}, function(error) {
					$scope.errorMessage = error;
					$scope.processing = false;
				});
			}
		};
	}]);

	module.controller("HomeController", ["$scope", "Auth", function($scope, Auth) {
		if (Auth.isLogged()) {
			$scope.welcomeMessage = "Olá " + Auth.getUser().name + ", seja bem vindo ao Quefo.me!";
		} else {
			$scope.welcomeMessage = "Olá, seja bem vindo ao Quefo.me!";
		}
	}]);

	module.controller("TesteController", ["$scope", function($scope) {
		$scope.teste = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	module.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	return module;
});