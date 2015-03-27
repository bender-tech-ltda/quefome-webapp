define(["angular", "quefome/admin/services", "quefome/admin/directives"], function(angular) {
	"use strict";
	
	var module = angular.module("qfAdminControllers", ["qfAdminServices", "qfAdminDirectives"]);

	module.controller("LoginController", ["$scope", "$location", "AuthService", function($scope, $location, AuthService) {
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

					$location.path("/");
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

	module.controller("OrdersFullfillmentController", ["$scope", "$timeout", "OrderService", function($scope, $timeout, OrderService) {
		$scope.orders = [];
		$scope.secondsToCheckForIncomingOrders = 30;
		$scope.cachedOrders = []
		$scope.numberOfIncomingOrders = 0;
		$scope.numberOfModifiedOrders = 0;

		var OrderStatus = {
			OPEN: 'OPEN', PRODUCTION: 'PRODUCTION', DELIVERED: 'DELIVERED'
		};

		var changeOrderStatus = function(order, newStatus) {
			order.changingStatus = true;
			$scope.$digest();

			var copiedOrder = angular.copy(order);
			copiedOrder.status = newStatus;

			return OrderService.update(copiedOrder).then(function(updatedOrder) {
				order.status = updatedOrder.status;
				order.version = updatedOrder.version;

				order.changingStatus = false;
				$scope.$digest();

				return true;
			}, function(errorMessage) {
				order.changingStatus = false;
				$scope.$digest();

				return false;
			});
		}

		$scope.sendOrderToProduction = function(order) {
			changeOrderStatus(order, OrderStatus.PRODUCTION);
		};

		$scope.markAsDelivered = function(order) {
			changeOrderStatus(order, OrderStatus.DELIVERED);
		};

		var countIncomingAndModifiedOrders = function(orders) {
			var totalIncomingOrders = 0, totalModifiedOrders = 0;

			var ordersIds = [];

			for (var orderIndex in orders) {
				var order = orders[orderIndex];
				var existentOrder = false;

				ordersIds.push(order.id);

				for (var scopeOrderIndex in $scope.orders) {
					var scopeOrder = $scope.orders[scopeOrderIndex];

					if (order.id == scopeOrder.id) {
						existentOrder = true;

						if (order.status != scopeOrder.status) {
							totalModifiedOrders++;
						}

						break;
					}
				}

				if (order.status == OrderStatus.OPEN && !existentOrder) {
					totalIncomingOrders++;
				}
			}

			for (var scopeOrderIndex in $scope.orders) {
				var scopeOrder = $scope.orders[scopeOrderIndex];

				if (ordersIds.indexOf(scopeOrder.id) < 0 && scopeOrder.status != 'DELIVERED') {
					totalModifiedOrders++;
				}
			}

			return {
				numberOfIncomingOrders: totalIncomingOrders,
				numberOfModifiedOrders: totalModifiedOrders
			};
		};

		var timeoutPromise = false;
		$scope.checkIncomingOrders = function() {
			OrderService.list().then(function(orders) {
				$scope.cachedOrders = orders;

				var totalOrders = countIncomingAndModifiedOrders(orders);
				$scope.numberOfIncomingOrders = totalOrders.numberOfIncomingOrders;
				$scope.numberOfModifiedOrders = totalOrders.numberOfModifiedOrders;

				$scope.$digest(function() {
					timeoutPromise = $timeout(function() {
						$scope.checkIncomingOrders();
					}, (1000 * $scope.secondsToCheckForIncomingOrders));
				});
			});
		};

		$scope.updateOrdersWithCachedOrders = function() {
			$scope.orders = $scope.cachedOrders;
			$scope.numberOfIncomingOrders = 0;
			$scope.numberOfModifiedOrders = 0;

			$scope.$digest();
		};

		OrderService.list().then(function(orders) {
			$scope.orders = orders;
			$scope.$digest(function() {
				$scope.checkIncomingOrders();
			});
		});

		$scope.$on("$destroy", function() {
			if (timeoutPromise) {
				$timeout.cancel(timeoutPromise);
			}
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