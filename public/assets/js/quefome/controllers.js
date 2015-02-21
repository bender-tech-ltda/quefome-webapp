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

	module.controller("HomeController", ["$scope", "ProductTypeService", function($scope, ProductTypeService) {
		$scope.productTypes = [];

		ProductTypeService.list().then(function(productTypes) {
			$scope.productTypes = productTypes;
			$scope.$digest();
		});
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

	module.controller("SearchEstablishmentController", ["$scope", "$location", "ProductTypeService", "EstablishmentService", function($scope, $location, ProductTypeService, EstablishmentService) {
		$scope.productTypes = [];
		$scope.establishments = [];

		var searchFilter = $location.search() ? $location.search() : {};
		var selectedProductType = searchFilter.productType ? {name: searchFilter.productType} : false;

		$scope.selectProductType = function(productType) {
			searchFilter.productType = productType ? productType.name : false;
			$location.search(searchFilter);

			$scope.searchEstablishments();
		};

		$scope.isProductTypeSelected = function(productType) {
			return searchFilter.productType && searchFilter.productType == productType.name;
		};

		$scope.searchEstablishments = function() {
			EstablishmentService.list(searchFilter).then(function(establishments) {
				$scope.establishments = establishments;
				$scope.$digest();
			});
		};

		ProductTypeService.list().then(function(productTypes) {
			$scope.productTypes = productTypes;
			$scope.$digest();
		});

		$scope.searchEstablishments();
	}]);

	module.controller("SelectPaymentMethodController", ["$scope", function($scope) {
		$scope.paymentMethods = [
			{
				name: "Dinheiro",
				category: {
					name: "Dinheiro"
				}
			},
			{
				name: "Mastercard",
				category: {
					name: "Cartão"
				}
			},
			{
				name: "Visa",
				category: {
					name: "Cartão"
				}
			}
		];

		$scope.paymentCategoriesGroupper = {};
		$scope.paymentCategories = [];

		for (var i in $scope.paymentMethods) {
			var method = $scope.paymentMethods[i];

			if (!$scope.paymentCategoriesGroupper[method.category.name]) {
				$scope.paymentCategoriesGroupper[method.category.name] = angular.copy(method.category);
				$scope.paymentCategoriesGroupper[method.category.name].paymentMethods = [];

				$scope.paymentCategories.push($scope.paymentCategoriesGroupper[method.category.name]);
			}

			$scope.paymentCategoriesGroupper[method.category.name].paymentMethods.push(method);
		}

		$scope.$digest();

		$scope.order = {
			paymentMethod: null
		};

	}]);

	module.controller("TesteController", ["$scope", function($scope) {
		$scope.teste = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	module.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	return module;
});