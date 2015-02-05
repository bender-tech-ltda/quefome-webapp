define(["angular", "quefome/services", "quefome/directives"], function(angular) {
	"use strict";
	
	var module = angular.module("qfControllers", ["qfServices", "qfDirectives"]);

	module.controller("UserMenuController", ["$scope", "AuthService", function($scope, AuthService) {
		$scope.loginView = "/partials/login/login";

		$scope.logout = function() {
			AuthService.logout().then(function() {
				$scope.$apply();
			});
		};

		$scope.isUserLogged = function() {
			return AuthService.isLogged();
		};
	}]);
	
	module.controller("LoginController", ["$scope", "AuthService", function($scope, AuthService) {
		$scope.email = "";
		$scope.password = "";
		$scope.keepLoggedIn = false;

		$scope.processing = false;
		$scope.errorMessage = false;

		$scope.registerView = "/partials/users/register";

		$scope.isLogged = function() {
			return AuthService.isLogged();
		};

		$scope.getUser = function() {
			return AuthService.getUser();
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

				return AuthService.login($scope.email, $scope.password, $scope.keepLoggedIn).then(function(user) {
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

	module.controller("HomeController", ["$scope", "AuthService", function($scope, AuthService) {
		$scope.productTypes = [
			{name: "Pizza"},
			{name: "Comida Japonesa"},
			{name: "Pastel"},
			{name: "Xis"},
			{name: "Comida Chinesa"},
			{name: "Comida Vegana"},
			{name: "Comida espacial"},
			{name: "Frutos do mar"}
		];

	}]);

	module.controller("NewUserController", ["$scope", "AuthService", "UserService", function($scope, AuthService, UserService) {
		$scope.user = {};

		$scope.processing = false;
		$scope.errorMessage = "";

		$scope.loginView = "/partials/login/login";

		$scope.isUserLoggedIn = function() {
			return AuthService.isLogged();
		};

		$scope.isUserFormValid = function() {
			if ($scope.form && $scope.form.$invalid) {
				if ($scope.form.name.$error.required) {
					$scope.errorMessage = "Por favor, informe seu nome";
				} else if ($scope.form.email.$error.required) {
					$scope.errorMessage = "Por favor, informe seu email";
				} else if ($scope.form.password.$error.required) {
					$scope.errorMessage = "Por favor, informe sua senha";
				} else if ($scope.form.email.$error.email) {
					$scope.errorMessage = "Por favor, informe um email válido";
				} else if ($scope.form.password.$error.minlength || $scope.form.password.$error.maxlength) {
					$scope.errorMessage = "A senha deve possuir de 6 à 20 caracteres";
				}

				return false;
			}

			$scope.errorMessage = false;

			return true;
		};

		$scope.saveAndLogin = function() {
			if ($scope.isUserFormValid()) {
				$scope.processing = true;
				UserService.save($scope.user, true).then(function() {
					$scope.$apply();

					if ($scope.$parent.$dialog) {
						$scope.$parent.$dialog.close();
					}

					$scope.processing = false;
				}, function(error) {
					$scope.errorMessage = error;
					$scope.processing = false;
				});
			}
		};
	}]);

	module.controller("TesteController", ["$scope", function($scope) {
		$scope.teste = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	module.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	return module;
});