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

	module.controller("SearchEstablishmentController", ["$scope", "$location", "$filter", "ProductTypeService", "EstablishmentService", function($scope, $location, $filter, ProductTypeService, EstablishmentService) {
		$scope.productTypes = [];

		$scope.establishments = [];

		var searchObject = $location.search();
		$scope.searchFilter = {
			query: searchObject.q || searchObject.query || "",
			productType: searchObject["product-type"] || searchObject.productType || ""
		};

		$scope.formatCurrentSchedule = function(establishment) {
			if (!establishment || !establishment.parameters || !establishment.parameters.currentSchedule) {
				return;
			}

			var status = establishment.parameters.status;
			var schedule = establishment.parameters.currentSchedule;

			if (status == 'OPEN') {
				return $filter("date")(schedule.openingTime, "HH:mm") + " até " + $filter("date")(schedule.closingTime, "HH:mm");
			}

			var weekDayName = schedule.weekDay.name;
			var today = new Date();
			if (schedule.weekDay.number == today.getDay()) {
				var openingTime = new Date(schedule.openingTime);

				if (today.getHours() < openingTime.getHours() ||
					(today.getHours() == openingTime.getHours() && today.getMinutes() < openingTime.getMinutes())) {
					weekDayName = "hoje";
				}
			} else if ((schedule.weekDay.number - today.getDay()) == 1) {
				weekDayName = "amanhã";
			}

			return "Abrirá " + weekDayName + ", às " + $filter("date")(schedule.openingTime, "HH:mm");

		};

		$scope.formatDeliveryTime = function(establishment) {
			if (!establishment || !establishment.parameters) {
				return "";
			}

			var parameters = establishment.parameters;
			if (parameters.minimumDeliveryTime && !parameters.maximumDeliveryTime) {
				return parameters.minimumDeliveryTime + "min."
			} else if (!parameters.minimumDeliveryTime && parameters.maximumDeliveryTime) {
				return parameters.maximumDeliveryTime + "min.";
			} else if (!parameters.minimumDeliveryTime && !parameters.maximumDeliveryTime) {
				return "0min."
			} else if (parameters.minimumDeliveryTime == parameters.maximumDeliveryTime) {
				return parameters.minimumDeliveryTime + "min."
			} else {
				return parameters.minimumDeliveryTime + " à " + parameters.maximumDeliveryTime + "min.";
			}
		};

		$scope.formatMoney = function(money) {
			return $filter('number')(money, 2).replace(",", "").replace(".", ",");
		};

		$scope.selectProductType = function(productType) {
			$scope.searchFilter.productType = productType ? productType.name : false;
			$scope.searchFilter.query = "";

			$scope.$digest();

			$scope.searchEstablishments();
		};

		$scope.isProductTypeSelected = function(productType) {
			return $scope.searchFilter.productType && $scope.searchFilter.productType == productType.name;
		};

		$scope.searchEstablishmentsNames = function(query, callback) {
			EstablishmentService.names(query).then(function(names) {
				callback(names);
			}, function() {
				callback([]);
			});
		};

		$scope.searchEstablishments = function() {
			if ($scope.searchFilter.query && $scope.searchFilter.productType) {
				$scope.searchFilter.productType = "";
				$scope.$digest();
			}

			var searchObject = {};
			if ($scope.searchFilter.query) {
				searchObject.q = $scope.searchFilter.query;
			}

			if ($scope.searchFilter.productType) {
				searchObject["product-type"] = $scope.searchFilter.productType;
			}

			$location.search(searchObject);

			EstablishmentService.list($scope.searchFilter).then(function(establishments) {
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

	module.controller("InformDeliveryAddressController", ["$scope", "NeighborhoodService", "AddressService", function($scope, NeighborhoodService, AddressService) {
		$scope.errorMessage = false;

		$scope.order = {
			address: {}
		};
		$scope.neighborhoods = [];

		$scope.searchingZipCode = false;
		$scope.completeAddressUsingZipCode = function() {
			$scope.errorMessage = false;

			if (!$scope.order.address.zipCode) {
				return;
			}

			$scope.searchingZipCode = true;

			AddressService.searchZipCode($scope.order.address.zipCode).then(function(address) {
				$scope.order.address.neighborhood = null;
				$scope.order.address.address = null;

				for (var i in $scope.neighborhoods) {
					var neighborhood = $scope.neighborhoods[i];

					if (neighborhood.name.toLowerCase().trim() == address.neighborhood.toLowerCase().trim()) {
						$scope.order.address.neighborhood = neighborhood;
						break;
					}
				}

				if (!$scope.order.address.neighborhood) {
					return;
				}

				$scope.order.address.address = address.address;
				$scope.searchingZipCode = false;
				$scope.$digest();
			}, function(message) {
				$scope.errorMessage = message;
				$scope.searchingZipCode = false;
				$scope.$digest();
			});
		};

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