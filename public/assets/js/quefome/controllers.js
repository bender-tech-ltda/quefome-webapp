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

	module.controller("SelectPaymentMethodController", ["$scope", "PaymentMethodService", function($scope, PaymentMethodService) {
		$scope.paymentCategories = [];
		$scope.order = {
			paymentMethod: null
		};

		$scope.isPaymentMethodSelected = function(paymentMethod) {
			if (!$scope.order.paymentMethod || !paymentMethod) {
				return false;
			}

			return $scope.order.paymentMethod.id == paymentMethod.id;
		};

		PaymentMethodService.list().then(function(paymentMethods) {
			var paymentCategoriesGroupper = {};

			for (var i in paymentMethods) {
				var method = paymentMethods[i];
				var category = null;

				if (!paymentCategoriesGroupper[method.category.name]) {
					category = angular.copy(method.category);
					category.paymentMethods = [];

					paymentCategoriesGroupper[method.category.name] = category;
					$scope.paymentCategories.push(category);
				} else {
					category = paymentCategoriesGroupper[method.category.name];
				}

				category.paymentMethods.push(method);
			}

			$scope.$digest();
		});

	}]);

	module.controller("InformDeliveryAddressController", ["$scope", "NeighborhoodService", function($scope, NeighborhoodService) {
		$scope.order = {};
		$scope.neighborhoods = [];

		NeighborhoodService.list().then(function(neighborhoods) {
			$scope.neighborhoods = neighborhoods;
		});
	}]);

	module.controller("TesteController", ["$scope", function($scope) {
		$scope.teste = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	module.controller("NotFoundController", ["$scope", function($scope) {
	}]);

	module.run(["$rootScope", "AuthService", function($rootScope, AuthService) {
		var doItSafe = function(what, callback) {
			if (typeof(callback) !== "function") {
				callback = function() {};
			}

			if (this.$$phase || this.$root.$$phase) {
				callback.call(this);
				return function() {};
			} else {
				return this[what](callback);
			}
		}

		$rootScope.__$digest = $rootScope.$digest;
		$rootScope.$digest = function(callback) {
			return doItSafe.call(this, "__$digest", callback);
		};

		$rootScope.__$apply = $rootScope.$apply;
		$rootScope.$apply = function(callback) {
			doItSafe.call(this, "__$apply", callback);
		};
		
		$rootScope.isUserLogged = function() {
			return AuthService.isLogged();
		};

		$rootScope.getLoggedUser = function() {
			return AuthService.getUser();
		};

		$rootScope.hasCheckedForLoggedUser = function() {
			return AuthService.hasCheckedForLoggedUser();
		};

		$rootScope.isCheckingForLoggedUser = function() {
			return AuthService.isCheckingForLoggedUser();
		};

		//a verificacao pelo usuario precisa ser chamada no modulo principal
		//se nao, os testes comecam a falhar por causa da requisicao HTTP inesperada
		$rootScope.checkForLoggedUser = function() {
			return AuthService.checkForLoggedUser().then(function() {
				$rootScope.$apply();
			});
		};
	}]);

	return module;
});