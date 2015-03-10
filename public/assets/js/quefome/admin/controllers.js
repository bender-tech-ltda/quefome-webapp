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

	module.controller("OrdersFullfillmentController", ["$scope", "OrderService", function($scope, OrderService) {
		$scope.orders = [
			{
				date: new Date(),
				status: "OPEN",

				user: {
					name: "Gabriel",
					email: "gabrielhof@gmail.com"
				},

				address: {
					address: "Rua Marechal Câmara",
					number: "22"
				},

				items: [
					{
						product: {
							name: "Xis Salada"
						}
					},
					{
						product: {
							name: "Xis Frango"
						}
					}
				]
			},
			{
				date: new Date(),
				status: "OPEN",

				user: {
					name: "Gabriel",
					email: "gabrielhof@gmail.com"
				},

				address: {
					address: "Rua Marechal Câmara",
					number: "22"
				},

				items: [
					{
						product: {
							name: "Xis Salada"
						}
					},
					{
						product: {
							name: "Xis Frango"
						}
					}
				]
			},
			{
				date: new Date(),
				status: "PRODUCTION",

				user: {
					name: "Gabriel",
					email: "gabrielhof@gmail.com"
				},

				address: {
					address: "Rua Marechal Câmara",
					number: "22"
				},

				items: [
					{
						product: {
							name: "Xis Salada"
						}
					},
					{
						product: {
							name: "Xis Frango"
						}
					}
				]
			}
		];

		OrderService.list().then(function(orders) {
			$scope.orders = orders;
			$scope.$digest();
		});
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

		$rootScope.logout = function() {
			return AuthService.logout().then(function() {
				$rootScope.$apply();
			});
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