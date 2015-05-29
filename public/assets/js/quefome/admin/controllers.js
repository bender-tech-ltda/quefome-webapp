define(["angular", "quefome/admin/services", "quefome/admin/directives", "quefome/admin/filters"], function(angular) {
	"use strict";
	
	var module = angular.module("qfAdminControllers", ["qfAdminServices", "qfAdminDirectives", "qfAdminFilters"]);

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

	module.controller("OrdersFullfillmentController", ["$scope", "$timeout", "Dialog", "OrderService", function($scope, $timeout, Dialog, OrderService) {
		$scope.orders = [];
		$scope.secondsToCheckForIncomingOrders = 30;
		$scope.cachedOrders = []
		$scope.numberOfIncomingOrders = 0;
		$scope.numberOfModifiedOrders = 0;

		$scope.loadedOrders = false;

		//TODO transformar em algum tipo de enum/factory/service/constante
		var OrderStatus = {
			OPEN: 'OPEN', PRODUCTION: 'PRODUCTION', DELIVERED: 'DELIVERED'
		};

		$scope.showOrderDetails = function(order) {
			Dialog.create({
				templateUrl: "/admin/partials/orders/detail.html",
				params: {order: order},
				show: true
			});
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
			var secontsToCheck = ($scope.secondsToCheckForIncomingOrders * 1000)

			OrderService.list().then(function(orders) {
				if (!$scope.loadedOrders) {
					$scope.orders = orders;
				} else {
					$scope.cachedOrders = orders;

					var totalOrders = countIncomingAndModifiedOrders(orders);
					$scope.numberOfIncomingOrders = totalOrders.numberOfIncomingOrders;
					$scope.numberOfModifiedOrders = totalOrders.numberOfModifiedOrders;
				}

				$scope.loadedOrders = true;

				timeoutPromise = $timeout($scope.checkIncomingOrders, secontsToCheck);
				$scope.$digest();
			}, function() {
				timeoutPromise = $timeout($scope.checkIncomingOrders, secontsToCheck);
			});
		};

		$scope.updateOrdersWithCachedOrders = function() {
			$scope.orders = $scope.cachedOrders;
			$scope.numberOfIncomingOrders = 0;
			$scope.numberOfModifiedOrders = 0;

			$scope.$digest();
		};

		$scope.checkIncomingOrders();

		$scope.$on("$destroy", function() {
			if (timeoutPromise) {
				$timeout.cancel(timeoutPromise);
			}
		});
	}]);

	module.controller("OrderDetailController", ["$scope", "OrderService", function($scope, OrderService) {
		$scope.order = null;

		$scope.changingOrderStatus = false;
		$scope.errorChangingStatus = false;

		$scope.hideActions = false;

		//TODO transformar em algum tipo de enum/factory/service/constante
		var OrderStatus = {
			OPEN: 'OPEN', PRODUCTION: 'PRODUCTION', DELIVERED: 'DELIVERED'
		};

		$scope.changeOrderStatus = function(newStatus) {
			$scope.changingOrderStatus = true;
			$scope.errorChangingStatus = false;

			return OrderService.changeStatus($scope.order, newStatus).then(function(updatedOrder) {
				$scope.order.status = updatedOrder.status;
				$scope.order.version = updatedOrder.version;

				$scope.changingOrderStatus = false;

				$scope.$digest();
			}, function(errorMessage) {
				$scope.changingOrderStatus = false;
				$scope.errorChangingStatus = true;

				$scope.$digest();
			});
		}

		$scope.markAsOpen = function() {
			$scope.changeOrderStatus(OrderStatus.OPEN);
		};

		$scope.sendOrderToProduction = function() {
			$scope.changeOrderStatus(OrderStatus.PRODUCTION);
		};

		$scope.markAsDelivered = function() {
			$scope.changeOrderStatus(OrderStatus.DELIVERED);
		};

		$scope.closeDialog = function() {
			if ($scope.$dialog) {
				$scope.$dialog.hide()
			}
		};

		$scope.$on("$dialogParameters", function(event, params) {
			if (params.order) {
				$scope.order = params.order;
			}

			$scope.hideActions = (params.hideActions ? true : false);
		});
	}]);

	module.controller("OrderSearchController", ["$scope", "$filter", "Dialog", "OrderService", function($scope, $filter, Dialog, OrderService) {
		$scope.orders = [];

		$scope.orderStatuses = [
			{key: 'OPEN', name: 'Aberto'},
			{key: 'PRODUCTION', name: 'Em Produção'},
			{key: 'DELIVERED', name: 'Entregue'},
		];

		$scope.filter = {
			status: null,
			fromDate: null,
			toDate: null
		};

		$scope.searchingOrders = false;
		$scope.searchError = false;

		$scope.searchOrders = function() {
			if ($scope.isFilterInvalid()) {
				return;
			}

			$scope.searchingOrders = true;
			$scope.searchError = false;

			OrderService.list($scope.filter).then(function(orders) {
				$scope.orders = orders;
				$scope.searchingOrders = false;
			}, function() {
				$scope.searchingOrders = false;
				$scope.searchError = true;
			});
		};

		$scope.isFilterInvalid = function() {
			if (!$scope.filter.fromDate || !($scope.filter.fromDate instanceof Date)) {
				return true;
			}

			if (!$scope.filter.toDate || !($scope.filter.toDate instanceof Date)) {
				return true;
			}

			$scope.filter.fromDate.setHours(0, 0, 0, 0);
			$scope.filter.toDate.setHours(23, 59, 59, 999);

			if ($scope.filter.fromDate.getTime() > $scope.filter.toDate.getTime()) {
				return true;
			}

			return false;
		};

		$scope.getInvalidFilterMessage = function() {
			if (!$scope.filterForm) {
				return "";
			}

			if ($scope.filterForm.fromDate && $scope.filterForm.fromDate.$error) {
				if ($scope.filterForm.fromDate.$error.required) {
					return "Informe a data inicial da realização dos pedidos";
				}

				if ($scope.filterForm.fromDate.$error.date) {
					return "Informe a data inicial no formato dia/mês/ano (por exemplo: " + $filter("date")(new Date(), "yyyy-MM-dd") + ")";
				}
			}

			if ($scope.filterForm.toDate && $scope.filterForm.toDate.$error) {
				if ($scope.filterForm.toDate.$error.required) {
					return "Informe a data final da realização dos pedidos";
				}

				if ($scope.filterForm.toDate.$error.date) {
					return "Informe a data final no formato dia/mês/ano (por exemplo: " + $filter("date")(new Date(), "yyyy-MM-dd") + ")";
				}
			}

			$scope.filter.fromDate.setHours(0, 0, 0, 0);
			$scope.filter.toDate.setHours(23, 59, 59, 999);

			if ($scope.filter.fromDate.getTime() > $scope.filter.toDate.getTime()) {
				return "A data inicial da realização dos pedidos não pode ser maior que a data final";
			}

			return "";
		};

		$scope.showOrderDetails = function(order) {
			Dialog.create({
				templateUrl: "/admin/partials/orders/detail.html",
				params: {order: order, hideActions: true},
				show: true
			});
		};

		$scope.startup = function() {
			$scope.filter.status = null;
			$scope.filter.fromDate = new Date();
			$scope.filter.toDate = new Date();

			$scope.searchOrders();
		};

		$scope.startup();
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