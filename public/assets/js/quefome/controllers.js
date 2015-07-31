define(["angular", "angular/route", "quefome/services", "quefome/directives", "quefome/filters", "angular/analytics"], function(angular) {
	"use strict";
	
	var module = angular.module("qfControllers", ["ngRoute", "angulartics", "qfServices", "qfDirectives", "qfFilters"]);

	module.controller("UserMenuController", ["$scope", "AuthService", function($scope, AuthService) {
		$scope.loginView = "/partials/login/login";

		$scope.isUserLogged = function() {
			return AuthService.isLogged();
		};
	}]);
	
	module.controller("LoginController", ["$scope", "Dialog", "AuthService", function($scope, Dialog, AuthService) {
		$scope.email = "";
		$scope.password = "";
		$scope.keepLoggedIn = false;

		$scope.processing = false;
		$scope.errorMessage = false;

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

					if ($scope.$dialog) {
						$scope.$dialog.hide(user);
					}
				}, function(error) {
					$scope.processing = false;

					if (error.isBusinessError) {
						$scope.errorMessage = error.message;
					}
				});
			}
		};

		$scope.showRegisterDialog = function() {
			Dialog.create({
				templateUrl: "/partials/users/register.html"
			}).then(function(dialog) {
				if ($scope.$dialog) {
					if ($scope.$dialog.onResponse) {
						dialog.onResponse = $scope.$dialog.onResponse;
						$scope.$dialog.onResponse = null;
					}

					$scope.$dialog.hide(function() {
						dialog.show();
					});
				} else {
					dialog.show();
				}
			});
		};
	}]);

	module.controller("NewUserController", ["$scope", "Dialog", "AuthService", "UserService", function($scope, Dialog, AuthService, UserService) {
		$scope.user = {};

		$scope.processing = false;
		$scope.errorMessage = "";

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
				UserService.save($scope.user, true).then(function(user) {
					$scope.$apply();

					if ($scope.$dialog) {
						$scope.$dialog.hide(user);
					}

					$scope.processing = false;
				}, function(error) {
					$scope.processing = false;

					if (error.isBusinessError) {
						$scope.errorMessage = error.message;
					}
				});
			}
		};

		$scope.showLoginDialog = function() {
			Dialog.create({
				templateUrl: "/partials/login/login.html"
			}).then(function(dialog) {
				if ($scope.$dialog) {
					if ($scope.$dialog.onResponse) {
						dialog.onResponse = $scope.$dialog.onResponse;
						$scope.$dialog.onResponse = null;
					}

					$scope.$dialog.hide(function() {
						dialog.show();
					});
				} else {
					dialog.show();
				}
			});
		};
	}]);

	module.controller("HomeController", ["$scope", "$location", "EstablishmentService", "ProductTypeService", function($scope, $location, EstablishmentService, ProductTypeService) {
		$scope.productTypes = [];
		$scope.query = "";

		$scope.loadingProductTypes = false;
		$scope.searchingEstablishments = false;

		$scope.searchEstablishmentsNames = function(query, callback) {
			EstablishmentService.names(query).then(function(names) {
				callback(names);
			}, function() {
				callback([]);
			});
		};

		$scope.searchEstablishments = function() {
			$scope.searchingEstablishments = true;

			$scope.$digest(function() {
				$location.path("/restaurantes/").search({q: $scope.query});
			});
		};

		$scope.loadingProductTypes = true;

		ProductTypeService.list().then(function(productTypes) {
			$scope.productTypes = productTypes;

			$scope.loadingProductTypes = false;
			$scope.$digest();
		});
	}]);

	module.controller("SearchEstablishmentController", ["$scope", "$routeParams", "$location", "$filter", "$analytics", "Dialog", "AddressService", "ProductTypeService", "EstablishmentService", function($scope, $routeParams, $location, $filter, $analytics, Dialog, AddressService, ProductTypeService, EstablishmentService) {
		$scope.productTypes = [];

		$scope.establishments = [];

		var searchObject = $location.search();
		$scope.searchFilter = {
			query: searchObject.q || searchObject.query || "",
			productType: $routeParams.productType || searchObject["product-type"] || searchObject.productType || ""
		};

		$scope.searchingEstablishments = false;
		$scope.loadingProductTypes = false;

		$scope.selectProductType = function(productType) {
			$scope.searchFilter.productType = productType ? productType.url : false;
			$scope.searchFilter.query = "";

			$scope.$digest();

			$scope.updatePageInfo();
			$scope.searchEstablishments();
		};

		$scope.isProductTypeSelected = function(productType) {
			return $scope.searchFilter.productType && $scope.searchFilter.productType == productType.url;
		};

		var originalTitle, originalDescription;
		$scope.updatePageInfo = function() {
			if (!originalTitle && !originalDescription) {
				originalTitle = $scope.$app.info.title;
				originalDescription = $scope.$app.info.description;
			} else {
				$scope.$app.info.title = originalTitle;
				$scope.$app.info.description = originalDescription;
			}
			
			if ($scope.searchFilter.productType) {
				var selectedProductType = null;

				for (var i in $scope.productTypes) {
					var type = $scope.productTypes[i];

					if (type.url == $scope.searchFilter.productType) {
						selectedProductType = type;
						break;
					}
				}

				if (selectedProductType) {
					$scope.$app.info.title = selectedProductType.name + " - Pesquisa de estabelecimentos - Quefo.me";
					$scope.$app.info.description = "Procurando por " + selectedProductType.name + "? Chega mais que temos restaurantes ultra-master-deliciosos para você!";
				}
			} else if ($scope.searchFilter.query) {
				$scope.$app.info.title = "'" + $scope.searchFilter.query + "'" + " - Pesquisa de estabelecimentos - Quefo.me";
				$scope.$app.info.description = "Procurando por '" + $scope.searchFilter.query + "'?  Chega mais que temos restaurantes ultra-master-deliciosos para você!";
			}
		};

		$scope.searchEstablishmentsNames = function(query, callback) {
			EstablishmentService.names(query).then(function(names) {
				callback(names);
			}, function() {
				callback([]);
			});
		};

		$scope.searchEstablishments = function() {
			$scope.searchingEstablishments = true;

			if ($scope.searchFilter.query && $scope.searchFilter.productType) {
				$scope.searchFilter.productType = "";
				$scope.$digest();
			}

			var searchObject = {};
			if ($scope.searchFilter.query) {
				$analytics.eventTrack("Search by Name", {
					category: "Establishment Search",
					label: $scope.searchFilter.query
				});

				searchObject.q = $scope.searchFilter.query;
			}

			$location.path("/restaurantes/" + $scope.searchFilter.productType, false).search(searchObject).replace();

			EstablishmentService.list($scope.searchFilter).then(function(establishments) {
				$scope.establishments = establishments;
				$scope.searchingEstablishments = false;

				$scope.$digest();
			});

			$scope.updatePageInfo();
		};

		$scope.loadingProductTypes = true;
		ProductTypeService.list().then(function(productTypes) {
			$scope.productTypes = productTypes;
			$scope.loadingProductTypes = false;
			
			$scope.updatePageInfo();

			$scope.$digest();
		});

		$scope.searchEstablishments();
	}]);

	module.controller("EstablishmentController", ["$scope", "$routeParams", "$window", "$location", "$filter", "$timeout", "Dialog", "AuthService", "EstablishmentService", "AddressService", "OrderService", function($scope, $routeParams, $window, $location, $filter, $timeout, Dialog, AuthService, EstablishmentService, AddressService, OrderService) {
		$scope.establishment = false;
		$scope.establishmentNotFound = false;

		$scope.productTypes = [];

		$scope.selectedProductType = null;
		$scope.orderDetailPanelOpen = false;

		$scope.isUserAddressAttended = false;

		$scope.loadingEstablishment = false;
		$scope.loadingProducts = false;

		$scope.order = {
			withdraw: false,
			address: null,
			items: []
		};

		$scope.formatScheduleInInternationalFormat = function(schedule) {
			var weekDaysAbbreviation = {
				"sunday": "Su",
				"monday": "Mo",
				"tuesday": "Tu",
				"wednesday": "We",
				"thursday": "Th",
				"friday": "Fr",
				"saturday": "Sa"
			};

			var openingTimeDate = new Date(schedule.openingTime);
			var closingTimeDate = new Date(schedule.closingTime);

			var result = weekDaysAbbreviation[schedule.weekDay.key] + " ";
			result += $filter("date")(openingTimeDate, "HH:mm") + "-" + $filter("date")(closingTimeDate, "HH:mm");

			return result;
		};

		$scope.refreshOrder = function(establishment) {
			if (!establishment) {
				establishment = {};
			}

			$scope.order = OrderService.retrieve(establishment) || $scope.order;
			$scope.order.establishment = establishment;

			var currentAddress = AddressService.getCurrentAddress();

			if ($scope.order.withdraw && establishment.parameters && establishment.parameters.canWithdraw) {
				$scope.order.withdraw = true;
				$scope.order.address = null;
			} else if (currentAddress && !currentAddress.skipped) {
				$scope.order.withdraw = false;
				$scope.order.address = currentAddress;
			} else {
				$scope.order.withdraw = false;
				$scope.order.address = null;
			}

			if ($scope.order.address) {
				EstablishmentService.isAttendingAddress(establishment, $scope.order.address).then(function(isAttending) {
					$scope.isUserAddressAttended = (isAttending ? true : false);
				});
			}

			$scope.refreshParameters();
			$scope.updatePageInfo();
		};

		var refreshParametersPromise = null;
		$scope.refreshParameters = function() {
			refreshParametersPromise = $timeout(function() {
				EstablishmentService.findByUrl($scope.establishment.url).then(function(establishment) {
					$scope.establishment = establishment;
					$scope.refreshParameters();					
				}, function() {
					$scope.refreshParameters();
				});
			}, 1000 * 60 * 5);
		};

		$scope.updatePageInfo = function() {
			if ($scope.establishmentNotFound) {
				$scope.$app.status.notFound({
					title: "Estabelecimento não encontrado - Quefo.me",
					description: "Não encontramos esse estabelecimento, mas temos vários outros esperando você!",
					noImage: false
				});
			} else {
				$scope.$app.info = {
					title: $scope.establishment.name + " - Quefo.me",
					description: $scope.establishment.description,
					imageUrl: $scope.establishment.imageUrl,
					largeImage: false
				};
			}
		};

		$scope.toggleProductType = function(productType) {
			if ($scope.selectedProductType && $scope.selectedProductType.id == productType.id) {
				$scope.selectedProductType = null;
			} else {
				$scope.selectedProductType = productType;
			}

			$scope.$digest();
		};

		$scope.isProductTypeSelected = function(productType) {
			return $scope.selectedProductType && productType && $scope.selectedProductType.id == productType.id;
		};

		$scope.filterProductTypes = function(productType) {
			if (!$scope.selectedProductType) {
				return true;
			}

			return $scope.isProductTypeSelected(productType);
		};

		$scope.groupProducts = function(products) {
			var productTypes = [];

			for (var i in products) {
				var product = products[i];
				var productType = null;

				if (!productTypes[product.type.id]) {
					productType = angular.copy(product.type);
					productType.products = [];

					productTypes[productType.id] = productType;
				} else {
					productType = productTypes[product.type.id];
				}

				productType.products.push(product);
			}

			$scope.productTypes = [];
			for (var i in productTypes) {
				$scope.productTypes.push(productTypes[i]);
			}

			$scope.$digest();
		};

		$scope.checkUserAddress = function(onResponseCallback) {
			if ($scope.order.withdraw) {
				return;
			}

			if (!$scope.order.address || !$scope.isUserAddressAttended) {
				Dialog.create({
					templateUrl: "/partials/establishments/check-address.html",
					show: true,
					backdrop: "static",
					hideOnEsc: false,
					params: {
						establishment: $scope.establishment
					},
					onResponse: function(response) {
						if (response) {
							if (response.skipped) {
								$scope.order.address = null;
								$scope.order.withdraw = $scope.establishment.parameters && $scope.establishment.parameters.canWithdraw ? true : false;

								$scope.isUserAddressAttended = false;
							} else {
								$scope.order.address = response.address;
								$scope.order.withdraw = false;

								$scope.isUserAddressAttended = response.isAttended ? true : false;
							}

							OrderService.store($scope.order);

							$scope.$digest();
						}

						if (typeof(onResponseCallback) === "function") {
							onResponseCallback(response);
						}
					}
				});
			}
		};

		$scope.customizeProduct = function(product) {
			if ($scope.order.address && !$scope.order.withdraw && !$scope.isUserAddressAttended) {
				$scope.checkUserAddress(function() {
					if ($scope.order.withdraw || $scope.isUserAddressAttended) {
						$scope.customizeProduct(product);
					}
				});

				return;
			}

			Dialog.create({
				templateUrl: "/partials/products/customize.html",
				show: true,
				params: {
					product: product
				},
				onResponse: function(orderItem) {
					if (orderItem) {
						$scope.order.items.push(orderItem);
						OrderService.store($scope.order);

						$scope.checkUserAddress();
					}
				}
			});
		};

		$scope.toggleOrderDetailPanel = function() {
			$scope.orderDetailPanelOpen = !$scope.orderDetailPanelOpen;
			$scope.$digest();
		};

		$scope.editOrderItem = function(orderItem) {
			Dialog.create({
				templateUrl: "/partials/products/customize.html",
				show: true,
				params: {
					orderItem: orderItem
				},
				onResponse: function(modifiedOrderItem) {
					if (modifiedOrderItem != orderItem) {
						var orderItemIndex = $scope.order.items.indexOf(orderItem);
						if (orderItemIndex >= 0) {
							$scope.order.items.splice(orderItemIndex, 1, modifiedOrderItem);
						}
					}

					OrderService.store($scope.order);
				}
			});
		};

		$scope.removeOrderItem = function(orderItem) {
			if (!$window.confirm("Deseja remover esse item do seu pedido?")) {
				return;
			}

			var orderIndex = $scope.order.items.indexOf(orderItem);
			if (orderIndex >= 0) {
				$scope.order.items.splice(orderIndex, 1);
				OrderService.store($scope.order);
			}
		};

		$scope.getOrderTotalPrice = function() {
			return OrderService.getOrderPrice($scope.order);
		};

		$scope.getOrderItemPrice = function(orderItem) {
			return OrderService.getOrderItemPrice(orderItem);
		};

		$scope.isOrderInvalid = function() {
			if ($scope.establishment && $scope.establishment.parameters && $scope.establishment.parameters.status != "OPEN") {
				return true;
			}

			if (!$scope.order || !$scope.order.items || $scope.order.items.length == 0) {
				return true;
			}

			if ($scope.establishment && $scope.establishment.parameters && $scope.establishment.parameters.minimumOrderValue) {
				var totalPrice = OrderService.getOrderPrice($scope.order, false);

				if (totalPrice < $scope.establishment.parameters.minimumOrderValue) {
					return true;
				}
			}

			return false;
		};

		$scope.getInvalidOrderMessage = function() {
			if ($scope.establishment && $scope.establishment.parameters && $scope.establishment.parameters.status != "OPEN") {
				return "O estabelecimento está fechado no momento.";
			}

			if ($scope.establishment && $scope.establishment.parameters && $scope.establishment.parameters.minimumOrderValue) {
				var minimumValue = $scope.establishment.parameters.minimumOrderValue;
				var totalPrice = OrderService.getOrderPrice($scope.order, false);

				if (totalPrice < minimumValue) {
					return "Esse estabelecimento só aceita pedidos acima de R$ " + $filter("money")(minimumValue) + " (sem o custo da tele-entrega).";
				}
			}

			if (!$scope.order || !$scope.order.items || $scope.order.items.length == 0) {
				return "Você precisa adicionar pelo menos um produto para fazer seu pedido.";
			}

			return "";
		};

		$scope.finishOrder = function() {
			var confirmAddress = function() {
				OrderService.store($scope.order);

				$scope.orderDetailPanelOpen = false;
				$location.path("/" + $scope.establishment.url + "/pedido/finalizar/");
			};

			if (!AuthService.isLogged()) {
				Dialog.create({
					templateUrl: "/partials/login/login.html",
					show: true,
					onResponse: function(user) {
						if (user) {
							confirmAddress();
						}
					}
				});

				return;
			}

			confirmAddress();
		};

		$scope.$on("$locationChangeStart", function(event) {
			if ($scope.orderDetailPanelOpen) {
				event.preventDefault();
				$scope.toggleOrderDetailPanel();
			}
		});

		$scope.$on("$destroy", function() {
			if (refreshParametersPromise) {
				$timeout.cancel(refreshParametersPromise);
			}
		});

		$scope.loadingEstablishment = true;

		EstablishmentService.findByUrl($routeParams.establishmentUrl).then(function(establishment) {
			$scope.establishment = establishment;
			$scope.refreshOrder(establishment);

			$scope.loadingEstablishment = false;
			$scope.loadingProducts = true;

			$scope.$digest();

			EstablishmentService.products(establishment).then(function(products) {
				$scope.groupProducts(products);
				$scope.loadingProducts = false;
			});
		}, function(error) {
			$scope.establishmentNotFound = error.isNotFoundError ? true : false;
			$scope.loadingEstablishment = !$scope.establishmentNotFound;

			$scope.updatePageInfo();
		});
	}]);

	module.controller("CustomizeProductController", ["$scope", function($scope) {
		$scope.product = null;
		$scope.componentCategories = null;

		$scope.selectedFlavors = [];

		$scope.instructions = "";
		$scope.quantity = 1;

		$scope.setCurrentProduct = function(product) {
			$scope.product = product;

			if ($scope.product && $scope.product.flavors) {
				for (var i in $scope.product.flavors) {
					$scope.product.flavors[i].selected = false;
				}
			}

			$scope.groupProductComponents(product);
		};

		$scope.groupProductComponents = function(product) {
			if (!product || !product.components || product.components.length <= 0) {
				$scope.componentCategories = null;
				return;
			}

			var categories = {};
			for (var i in product.components) {
				var component = product.components[i];

				var categoryKey = null;
				var category = null;
				var categorySequence = null;

				if (component.options) {
					categoryKey = component.name;
					categorySequence = component.sequence;

					for (var o in component.options) {
						if (component.options[o].defaultOption) {
							component.option = component.options[o];
							break;
						}
					}
				} else {
					categoryKey = component.category;
					categorySequence = component.categorySequence;

					component.value = component.defaultValue ? true : false;
				};

				if (!categories[categoryKey]) {
					category = {name: categoryKey, sequence: categorySequence, components: []};

					categories[categoryKey] = category;
				} else {
					category = categories[categoryKey];
				}

				category.components.push(component);
			}

			$scope.componentCategories = [];
			for (var i in categories) {
				$scope.componentCategories.push(categories[i]);
			}

			$scope.$digest();
		};

		var getFlavorsPrice = function() {
			if (!$scope.selectedFlavors || $scope.selectedFlavors.length == 0) {
				return 0;
			}

			var price = 0;
			var billingType = $scope.product && $scope.product.billingType ? $scope.product.billingType : "SUM";

			for (var i in $scope.selectedFlavors) {
				var flavor = $scope.selectedFlavors[i];

				if (billingType == "HIGHEST_PRICE") {
					if (flavor.price && flavor.price > price) {
						price = flavor.price;
					}
				} else {
					price += (flavor.price ? flavor.price : 0.0);
				}
			}

			if (billingType == "AVERAGE_PRICE") {
				price = (price / $scope.selectedFlavors.length);
			}

			return price;
		};

		var getComponentsPrice = function() {
			var price = 0;

			if ($scope.product.components) {
				for (var i in $scope.product.components) {
					var component = $scope.product.components[i];

					if (typeof(component.value) !== "boolean" && component.defaultValue) {
						price += (component.price || 0.0);
					} else if (component.value) {
						price += (component.price || 0.0);
					} else if (component.option) {
						price += (component.option.price || 0.0);
					} else if (component.defaultOption) {
						price += (component.defaultOption.price || 0.0);
					}
				}
			}

			return price;
		};

		$scope.calculateTotalPrice = function() {
			if (!$scope.product) {
				return 0;
			}

			var total = $scope.product.price || 0.0;
			
			total += getFlavorsPrice();
			total += getComponentsPrice();

			var quantity = typeof($scope.quantity) === "number" && $scope.quantity > 0 ? $scope.quantity : 0; 
			return total * quantity;
		};

		$scope.toggleSelectedFlavor = function(flavor) {
			var flavorIndex = $scope.selectedFlavors.indexOf(flavor);
			if (flavorIndex >= 0 && !flavor.selected) {
				$scope.selectedFlavors.splice(flavorIndex, 1);
			} else if (flavorIndex < 0 && flavor.selected) {
				$scope.selectedFlavors.push(flavor);
			}

			$scope.$digest();
		};

		$scope.isFlavorDisabled = function(flavor) {
			return !flavor.selected && $scope.selectedFlavors.length >= $scope.product.flavorsAmount;
		};

		$scope.isOrderItemValid = function() {
			if (!$scope.product) {
				return false;
			}

			if ($scope.product.flavors && $scope.product.flavors.length > 0 && $scope.selectedFlavors.length == 0) {
				return false;
			}

			if ($scope.product.flavorsAmount && $scope.selectedFlavors.length > $scope.product.flavorsAmount) {
				return false;
			}

			if ($scope.productForm && $scope.productForm.quantity.$invalid) {
				return false;
			}

			return true;
		};

		$scope.createOrderItem = function() {
			if (!$scope.isOrderItemValid()) {
				return false;
			}

			var orderItem = {
				product: $scope.product,
				components: [],
				flavors: $scope.selectedFlavors,
				quantity: $scope.quantity,
				instructions: $scope.instructions
			};

			for (var i in $scope.product.components) {
				var component = $scope.product.components[i];

				var itemComponent = {
					component: component
				};

				if (component.option) {
					itemComponent.selectedOption = component.option;
				} else {
					itemComponent.value = component.value
				}

				orderItem.components.push(itemComponent);
			}

			$scope.closeDialog(orderItem);

			return orderItem;
		};

		$scope.closeDialog = function(parameter) {
			if ($scope.$dialog) {
				$scope.$dialog.hide(parameter);
			}
		};

		$scope.extractOrderItem = function(orderItem) {
			$scope.setCurrentProduct(orderItem.product);

			$scope.instructions = orderItem.instructions ? orderItem.instructions : "";
			$scope.quantity = orderItem.quantity ? orderItem.quantity : 1;

			var indexedComponents = false;
			var indexedOptions = false;
			var indexedFlavors = false;

			if ($scope.product.flavors && $scope.product.flavors.length > 0) {
				indexedFlavors = {};

				for (var flavorIndex in $scope.product.flavors) {
					var flavor = $scope.product.flavors[flavorIndex];
					indexedFlavors[flavor.id] = flavor;
				}
			}

			if ($scope.componentCategories && $scope.componentCategories.length > 0) {
				indexedComponents = {};
				indexedOptions = {};

				for (var categoryIndex in $scope.componentCategories) {
					var category = $scope.componentCategories[categoryIndex];

					for (var componentIndex in category.components) {
						var component = category.components[componentIndex];
						indexedComponents[component.id] = component;

						if (component.options && component.options.length > 0) {
							for (var optionIndex in component.options) {
								var option = component.options[optionIndex];
								indexedOptions[option.id] = option;
							}
						}
					}
				}
			}

			if (orderItem.flavors && orderItem.flavors.length > 0 && indexedFlavors) {
				$scope.selectedFlavors = [];

				for (var flavorIndex in orderItem.flavors) {
					var flavor = orderItem.flavors[flavorIndex];

					var productFlavor = indexedFlavors[flavor.id];
					if (productFlavor) {
						productFlavor.selected = true;
						$scope.selectedFlavors.push(productFlavor);
					}
				}
			}

			if (orderItem.components && orderItem.components.length > 0 && indexedComponents) {
				for (var itemComponentIndex in orderItem.components) {
					var itemComponent = orderItem.components[itemComponentIndex];

					if (!itemComponent.component) {
						continue;
					}

					var component = indexedComponents[itemComponent.component.id];
					if (!component) {
						continue;
					}

					if (itemComponent.selectedOption) {
						var option = indexedOptions[itemComponent.selectedOption.id];
						if (option) {
							component.option = option;
						}
					} else if (typeof(itemComponent.value) !== "undefined") {
						component.value = itemComponent.value;
					}
				}
			}

			$scope.$digest();
		};

		$scope.$on("$dialogParameters", function(event, params) {
			if (params) {
				if(params.product) {
					$scope.setCurrentProduct(params.product);
				}

				if(params.orderItem) {
					$scope.extractOrderItem(params.orderItem)
				}
			}
		});
	}]);

	module.controller("CheckAddressController", ["$scope", "$location", "$analytics", "AddressService", "EstablishmentService", "OrderService", function($scope, $location, $analytics, AddressService, EstablishmentService, OrderService) {
		var alreadyInformedAddress = AddressService.getCurrentAddress();

		$scope.address = alreadyInformedAddress ? alreadyInformedAddress : {};
		$scope.zipCode = $scope.address.zipCode ? $scope.address.zipCode : "";

		$scope.isZipCodeFormVisible = true;

		$scope.invalidZipCode = false;
		$scope.invalidAddress = false;

		$scope.addressChecked = false;
		$scope.addressAttended = null;
		$scope.processing = false;

		$scope.establishment = {};

		$scope.$on("$dialogParameters", function(event, params) {
			if (params && params.establishment) {
				$scope.establishment = params.establishment;
			}

			if (alreadyInformedAddress) {
				$scope.zipCode = alreadyInformedAddress.zipCode;
				$scope.$digest(function() {
					if ($scope.zipCode) {
						$scope.checkZipCode();
					}
				});
			}
		});

		var checkIfEstablishmentAttendsTheAddress = function(address) {
			EstablishmentService.isAttendingAddress($scope.establishment, address).then(function(isAttending) {
				AddressService.setCurrentAddress(address);

				$scope.addressChecked = true;
				$scope.addressAttended = isAttending;

				$scope.processing = false;

				if (isAttending) {
					$scope.closeDialog();
				} else {
					$analytics.eventTrack("Establishment doesn't attend User Address", {
						category: "Address not attended",
						label: angular.toJson(address)
					});
				}
			}, function() {
				$scope.addressChecked = false;
				$scope.searchingZipCode = false;

				$scope.processing = false;
			});
		};

		$scope.checkZipCode = function() {
			if ($scope.zipCodeForm.$invalid) {
				return;
			}

			$scope.processing = true;

			AddressService.searchZipCode($scope.zipCode).then(function(address) {
				$scope.address = address;
				$scope.invalidZipCode = false;

				checkIfEstablishmentAttendsTheAddress(address);
			}, function() {
				$scope.processing = false;
				$scope.addressChecked = false;

				$scope.invalidZipCode = true;

				$analytics.eventTrack("Zip Code not found", {
					category: "Address not attended",
					label: $scope.zipCode
				});
			});
		};

		$scope.checkAddress = function() {
			if ($scope.addressForm.$invalid) {
				return;
			}

			$scope.processing = true;
			var address = {
				address: $scope.address.address,
				city: {
					name: "Porto Alegre",
					state: {
						acronym: "RS"
					}
				}
			};

			AddressService.searchAddress(address).then(function(address) {
				$scope.address = address;
				$scope.invalidAddress = false;

				checkIfEstablishmentAttendsTheAddress(address);
			}, function() {
				$scope.processing = false;
				$scope.addressChecked = false;

				$scope.invalidAddress = true;

				$analytics.eventTrack("Address not found", {
					category: "Address not attended",
					label: angular.toJson(address)
				});
			});
		};

		$scope.showAddressForm = function() {
			$scope.isZipCodeFormVisible = false;
			$scope.address = {};
			
			$scope.invalidAddress = false;
			$scope.addressForm.$submitted = false;
			
			$scope.addressChecked = false;
			$scope.addressAttended = null;

			$scope.$digest();
		};

		$scope.showZipCodeForm = function() {
			$scope.isZipCodeFormVisible = true;
			$scope.zipCode = "";

			$scope.invalidZipCode = false;
			$scope.zipCodeForm.$submitted = false;

			$scope.addressChecked = false;
			$scope.addressAttended = null;

			$scope.$digest();
		};

		$scope.skipAddressVerification = function() {
			AddressService.setCurrentAddress({skipped: true});
			$scope.closeDialog(true);
		};

		$scope.goToEstablishmentSearch = function() {
			if ($scope.$dialog) {
				OrderService.remove({
					establishment: $scope.establishment
				});

				$scope.$dialog.beforeHide(function() {
					$location.path("/restaurantes/");
					$scope.$apply();
				});

				$scope.$dialog.hide();
			}
		};

		$scope.closeDialog = function(skipped) {
			var response = {
				address: $scope.address,
				isAttended: $scope.addressAttended ? true : false,
				skipped: skipped ? true : false
			};

			if ($scope.$dialog) {
				$scope.$dialog.hide(response);
			}
		};
	}]);

	module.controller("OrderFinishController", ["$scope", "$routeParams", "$location", "$flashStorage", "AuthService", "EstablishmentService", "OrderService", "AddressService", function($scope, $routeParams, $location, $flashStorage, AuthService, EstablishmentService, OrderService, AddressService) {
		$scope.establishment = null;
		$scope.establishmentNotFound = false;

		$scope.order = {};

		$scope.addressInputMethod = 'zip-code';

		$scope.address = {
			zipCode: "",
			address: ""
		};

		$scope.addressStatus = {
			zipCodeValid: false,
			zipCodeChecked: false,
			addressValid: false,
			addressChecked: false,
			addressAttended: false,
			processing: false
		};

		$scope.loadingEstablishment = false;

		$scope.processingOrder = false;
		$scope.finishOrderError = false;

		$scope.paymentCategories = [];

		$scope.categorizePaymentMethods = function() {
			$scope.paymentCategories = [];

			if (!$scope.establishment || !$scope.establishment.parameters || !$scope.establishment.parameters.paymentMethods) {
				return;
			}

			var categories = []

			for (var i in $scope.establishment.parameters.paymentMethods) {
				var method = $scope.establishment.parameters.paymentMethods[i];
				var category = null;

				if (!categories[method.category.name]) {
					category = angular.copy(method.category);
					category.paymentMethods = [];

					categories[method.category.name] = category;
					$scope.paymentCategories.push(category);
				} else {
					category = categories[method.category.name];
				}

				category.paymentMethods.push(method);
			}
		};

		$scope.showChangeField = function(category) {
			if (!$scope.order.paymentMethod || !category.hasChange) {
				return false;
			}

			return category.paymentMethods.indexOf($scope.order.paymentMethod) >= 0
		};

		$scope.isFieldChangeInvalid = function(category) {
			if (!$scope.paymentForm) {
				return false;
			}

			var field = $scope.paymentForm["change-" + category.key];

			if (!field) {
				return false;
			}

			return field.$touched && field.$invalid;
		};

		$scope.lastDeliveryType = null;
		$scope.changeDeliveryType = function() {
			if ($scope.lastDeliveryType == $scope.order.withdraw) {
				return;
			}

			if (!$scope.order.withdraw) {
				$scope.lastAddressInputMethod = null;
				$scope.changeAddressInputMethod();
			} else {
				$scope.order.address = null;
			}

		};

		$scope.lastAddressInputMethod = null;
		$scope.changeAddressInputMethod = function() {
			if ($scope.lastAddressInputMethod == $scope.addressInputMethod) {
				return;
			}

			$scope.lastAddressInputMethod = $scope.addressInputMethod;

			if ($scope.addressInputMethod == 'zip-code') {
				$scope.addressStatus.zipCodeChecked = false;
				$scope.addressStatus.zipCodeValid = false;

				if ($scope.address.zipCode) {
					$scope.checkZipCode();
				}
			} else {
				$scope.addressStatus.addressChecked = false;
				$scope.addressStatus.addressValid = false;

				if ($scope.address.address) {
					$scope.checkAddress();
				}
			}
		};

		$scope.checkIfEstablishmentAttendsTheAddress = function(address) {
			$scope.addressStatus.processing = true;

			AddressService.setCurrentAddress(address);

			EstablishmentService.isAttendingAddress($scope.establishment, address).then(function(isAttending) {
				$scope.addressStatus.addressAttended = isAttending;
				$scope.addressStatus.processing = false;

				//TODO procurar bairro
				$scope.order.address = {
					zipCode: address.zipCode,
					address: address.address,
					neighborhood: {name: address.neighborhood},
					city: address.city,
					number: "",
					complement: ""
				};
			}, function() {
				$scope.order.address = null;
				$scope.addressStatus.addressAttended = false;
				$scope.addressStatus.processing = false;
			});
		};

		$scope.checkZipCode = function() {
			if (!$scope.address.zipCode) {
				return;
			}

			$scope.addressStatus.zipCodeChecked = false;
			$scope.addressStatus.processing = true;

			AddressService.searchZipCode($scope.address.zipCode).then(function(address) {
				$scope.addressStatus.zipCodeChecked = true;
				$scope.addressStatus.zipCodeValid = true;

				$scope.address.address = address.address;

				$scope.checkIfEstablishmentAttendsTheAddress(address);
			}, function() {
				$scope.order.address = null;

				$scope.addressStatus.zipCodeValid = false;
				$scope.addressStatus.zipCodeChecked = true;

				$scope.addressStatus.addressAttended = false;

				$scope.addressStatus.processing = false;
			});
		};

		$scope.checkAddress = function() {
			if ($scope.addressForm.address.$invalid) {
				return;
			}

			$scope.addressStatus.addressChecked = false;
			$scope.addressStatus.processing = true;

			var address = {
				address: $scope.address.address,
				city: {
					name: "Porto Alegre",
					state: {
						acronym: "RS"
					}
				}
			};

			AddressService.searchAddress(address).then(function(address) {
				$scope.addressStatus.addressChecked = true;
				$scope.addressStatus.addressValid = true;

				$scope.address.zipCode = address.zipCode;

				$scope.checkIfEstablishmentAttendsTheAddress(address);
			}, function() {
				$scope.order.address = null;

				$scope.addressStatus.addressValid = false;

				$scope.addressStatus.addressChecked = true;
				$scope.addressStatus.addressAttended = false;

				$scope.addressStatus.processing = false;
			});
		};

		$scope.getOrderTotalPrice = function() {
			return OrderService.getOrderPrice($scope.order);
		};

		$scope.goToEstablishmentPage = function() {
			$location.path("/" + $routeParams.establishmentUrl);
		};

		$scope.goToEstablishmentSearch = function() {
			OrderService.remove($scope.order);
			$location.path("/restaurantes/");
		};

		$scope.isFinishValid = function() {
			if (!$scope.order) {
				return false;
			}

			if (!$scope.order.withdraw && (!$scope.order.address || !$scope.order.address.number)) {
				return false;
			}

			if (!$scope.order.phone) {
				return false;
			}

			if (!$scope.order.paymentMethod) {
				return false;
			}

			return true;
		};

		$scope.getErrorMessage = function() {
			if (!$scope.order) {
				return "";
			}

			if (!$scope.order.withdraw) {
				if (!$scope.addressStatus.zipCodeValid && !$scope.addressStatus.addressValid) {
					return "Você precisa informar o endereço de entrega do seu pedido";
				}

				if (($scope.addressStatus.zipCodeChecked || $scope.addressStatus.addressChecked) && !$scope.addressStatus.addressAttended) {
					return "Você precisa informar um endereço que seja atendido pelo estabelecimento";
				}

				if ($scope.order.address && !$scope.order.address.number) {
					return "Você precisa informar o número do local onde seu pedido deve ser entregue.";
				}
			}

			if (!$scope.order.phone) {
				return "Você precisa informar um telefone para contato";
			}

			if (!$scope.order.paymentMethod) {
				return "Você precisa selecionar uma forma de pagamento";
			}

			return "";
		};

		$scope.finishOrder = function() {
			if (!$scope.isFinishValid()) {
				return;
			}

			$scope.processingOrder = true;
			$scope.finishOrderError = false;

			OrderService.create($scope.order).then(function(order) {
				$flashStorage.set("recentlyCreatedOrder", order);
				$location.path("/usuario/pedidos/");

				$scope.processingOrder = false;
			}, function(status) {
				$scope.processingOrder = false;

				if (status.isBusinessError) {
					$scope.finishOrderError = status.message;
				}
			});
		};

		$scope.startup = function() {
			if (!$routeParams.establishmentUrl) {
				$location.path("/restaurantes/");
			}

			if (!AuthService.isLogged()) {
				$scope.goToEstablishmentPage();
				return;
			}

			$scope.loadingEstablishment = true;

			EstablishmentService.findByUrl($routeParams.establishmentUrl).then(function(establishment) {
				$scope.establishment = establishment;
				$scope.order = OrderService.retrieve(establishment);

				if (!$scope.order || !$scope.order.items || $scope.order.items.length == 0) {
					$scope.goToEstablishmentPage();
					return;
				}

				$scope.order.user = AuthService.getUser();
				$scope.order.phone = $scope.order.user.phone || "";

				$scope.order.paymentMethod = null;

				if (establishment.parameters && establishment.parameters.canWithdraw) {
					$scope.order.withdraw = $scope.order.withdraw ? true : false;
				} else {
					$scope.order.withdraw = false;
				}

				var address = AddressService.getCurrentAddress();
				if (address && !address.skipped) {
					$scope.address = {
						zipCode: address.zipCode,
						address: address.address
					};
				}

				$scope.categorizePaymentMethods();
				$scope.changeDeliveryType();

				$scope.loadingEstablishment = false;
			}, function(error) {
				$scope.establishmentNotFound = error.isNotFoundError ? true : false;
				$scope.loadingEstablishment = !$scope.establishmentNotFound;
			});
		};

		if (AuthService.hasCheckedForLoggedUser()) {
			$scope.startup();
		} else {
			$scope.$on("$userLoginChecked", function() {
				$scope.startup();
			});
		}

		$scope.$on("$userLogout", function() {
			$scope.goToEstablishmentPage();
		});
	}]);

	module.controller("OrderTrackController", ["$scope", "$timeout", "$flashStorage", "$notification", "Dialog", "AuthService", "OrderService", function($scope, $timeout, $flashStorage, $notification, Dialog, AuthService, OrderService) {
		$scope.secondsToRefreshTheOrders = 30;

		$scope.orders = [];

		$scope.ordersSearched = false;
		$scope.searchingOrders = false;

		$scope.recentlyCreatedOrder = null;

		var orderStatus = {};
		var lastNotification = {hide: function() {}};
		$scope.notifyStatusChanged = function() {
			var orderStatusQuantity = {};

			for (var i in $scope.orders) {
				var order = $scope.orders[i];

				var oldStatus = orderStatus[order.id];

				if (oldStatus && oldStatus != order.status) {
					if (!orderStatusQuantity[order.status]) {
						orderStatusQuantity[order.status] = 0;
					}

					orderStatusQuantity[order.status]++;
				}

				orderStatus[order.id] = order.status;
			}

			if (orderStatusQuantity.PRODUCTION == 1) {
				lastNotification.hide();
				lastNotification = $notification.notify("Quefo.me: Ta no forno!", "Seu pedido acabou de ir para o forno");
			} else if (orderStatusQuantity.PRODUCTION > 1) {
				lastNotification.hide();
				lastNotification = $notification.notify("Quefo.me: Tão no forno!", "Seus pedidos acabaram de ir para o forno");
			}
		};

		var timeoutPromise = null;		
		$scope.refreshOrders = function() {
			if (!$scope.isUserLogged()) {
				timeoutPromise = $timeout($scope.refreshOrders, 500);
				return;
			}

			$notification.requestPermission();

			$scope.searchingOrders = true;

			var refreshTime = 1000 * $scope.secondsToRefreshTheOrders;
			OrderService.list().then(function(orders) {
				$scope.orders = orders;

				$scope.ordersSearched = true;
				$scope.searchingOrders = false;

				$scope.notifyStatusChanged();

				timeoutPromise = $timeout($scope.refreshOrders, refreshTime);
			}, function() {
				$scope.searchingOrders = false;
				timeoutPromise = $timeout($scope.refreshOrders, refreshTime);
			});
		};

		$scope.isLoginChecked = function() {
			return AuthService.hasCheckedForLoggedUser();
		};

		$scope.isUserLogged = function() {
			return AuthService.isLogged();
		};

		$scope.login = function() {
			Dialog.create({
				templateUrl: "/partials/login/login.html",
				show: true
			});
		};

		$scope.startup = function() {
			$scope.recentlyCreatedOrder = $flashStorage.get("recentlyCreatedOrder") || null;

			$scope.refreshOrders();
		};

		$scope.$on("$destroy", function() {
			if (timeoutPromise) {
				$timeout.cancel(timeoutPromise);
			}
		});

		$scope.startup();
	}]);

	module.controller("TesteController", ["$scope", function($scope) {
		$scope.teste = "Olá, seja bem vindo ao Quefo.me!";
	}]);

	module.controller("NotFoundController", ["$scope", function($scope) {
		$scope.$app.status.notFound();
	}]);

	module.run(["$rootScope", "$timeout", "$location", "$route", "AuthService", function($rootScope, $timeout, $location, $route, AuthService) {
		var originalPathFunction = $location.path;

		$location.path = function(path, reload) {
			var currentPath = originalPathFunction.call(this);

			if (reload === false && currentPath != path) {
				var currentRoute = $route.current;

				$rootScope.$$isLocationNotReloading = true;
				var destroyEvent = $rootScope.$on('$locationChangeSuccess', function() {
					$route.current = currentRoute;

					delete($rootScope.$$isLocationNotReloading);
					destroyEvent();
				});
			}

			return originalPathFunction.apply(this, arguments);
		};

		$rootScope.$app = {
			header: {
				status: null,
			},

			info: {
				name: null,
				title: null,
				description: null,
				websiteType: null,
				imageUrl: null,
				largeImage: null,
				noImage: null,
			},

			route: {
				loading: false,
				loadingMessage: false,
				originalPath: ""
			},

			status: {
				notFound: function(info) {
					info = info || {};
					info.title = info.title || "Página não encontrada - Quefo.me";
					info.description = info.description || "Desculpe, mas não encontramos a página que você está procurando.";
					info.noImage = (info.noImage === false ? false : true);

					return this.code(404, info);
				},

				error: function(info) {
					info = info || {};
					info.title = info.title || "Tivemos um problema - Quefo.me";
					info.noImage = (info.noImage === false ? false : true);

					return this.code(500, info);
				},

				code: function(code, info) {
					$rootScope.$app.header.status = code;

					if (info) {
						$rootScope.$app.info = info;
					}

					return this;
				}
			}
		};

		$rootScope.$on('$routeChangeStart', function (event, nextRoute, currentRoute) {
			if ($rootScope.$$isLocationNotReloading) {
				return;
			}

			if (nextRoute && nextRoute.$$route) {
				nextRoute = nextRoute.$$route;
			}

			$rootScope.$app.status.code(200, (nextRoute.pageInfo ? angular.copy(nextRoute.pageInfo) : {}));
			$rootScope.$app.route.originalPath = "";

			if (nextRoute && nextRoute.loadingMessage) {
				$rootScope.$app.route.loadingMessage = nextRoute.loadingMessage;
			} else {
				$rootScope.$app.route.loadingMessage = false;
			}

			$rootScope.$app.route.loading = true;
		});

		$rootScope.$on('$routeChangeSuccess', function (event, currentRoute) {
			if (currentRoute && currentRoute.$$route && currentRoute.$$route.redirectTo) {
				$rootScope.$app.route.originalPath = currentRoute.$$route.redirectTo;
			} else {
				$rootScope.$app.route.originalPath = $location.path();
			}

			$timeout(function(){
				$rootScope.$app.route.loading = false;
			}, 200);
		});

		$rootScope.$on('$routeChangeError', function () {
			$rootScope.$app.route.loading = false;
			$rootScope.$app.status.error();
		});

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
		
		$rootScope.logoutUser = function() {
			AuthService.logout().then(function() {
				$rootScope.$broadcast("$userLogout");
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
			return AuthService.checkForLoggedUser().then(function(user) {
				$rootScope.$broadcast("$userLoginChecked", user);
				$rootScope.$apply();
			});
		};

		$rootScope.baseUrl = function() {
			var absUrl = $location.absUrl();
			var currentUrl = $location.url();

			return absUrl.replace(currentUrl, "");
		};

		$rootScope.currentUrl = function() {
			return $location.url();
		};
	}]);

	return module;
});