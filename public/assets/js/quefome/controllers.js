define(["angular", "quefome/services", "quefome/directives", "quefome/filters"], function(angular) {
	"use strict";
	
	var module = angular.module("qfControllers", ["qfServices", "qfDirectives", "qfFilters"]);

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
					$scope.errorMessage = error;
					$scope.processing = false;
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
					$scope.errorMessage = error;
					$scope.processing = false;
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

		$scope.searchEstablishmentsNames = function(query, callback) {
			EstablishmentService.names(query).then(function(names) {
				callback(names);
			}, function() {
				callback([]);
			});
		};

		$scope.searchEstablishments = function() {
			$location.path("/establishments/search").search({q: $scope.query});
		};

		ProductTypeService.list().then(function(productTypes) {
			$scope.productTypes = productTypes;
			$scope.$digest();
		});
	}]);

	module.controller("SearchEstablishmentController", ["$scope", "$location", "$filter", "Dialog", "AddressService", "ProductTypeService", "EstablishmentService", function($scope, $location, $filter, Dialog, AddressService, ProductTypeService, EstablishmentService) {
		$scope.productTypes = [];

		$scope.establishments = [];

		var searchObject = $location.search();
		$scope.searchFilter = {
			query: searchObject.q || searchObject.query || "",
			productType: searchObject["product-type"] || searchObject.productType || ""
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

	module.controller("EstablishmentController", ["$scope", "$routeParams", "$window", "Dialog", "AuthService", "EstablishmentService", "AddressService", "OrderService", function($scope, $routeParams, $window, Dialog, AuthService, EstablishmentService, AddressService, OrderService) {
		$scope.establishment = false;
		$scope.productTypes = [];

		$scope.selectedProductType = null;
		$scope.orderDetailPanelOpen = false;

		$scope.isUserAddressAttended = null;

		$scope.order = {
			withdraw: false,
			address: null,
			items: []
		};

		$scope.refreshOrder = function(establishment) {
			if (!establishment) {
				establishment = {};
			}

			$scope.order = OrderService.retrieve(establishment) || $scope.order;
			$scope.order.establishment = establishment;

			var currentAddress = AddressService.getCurrentAddress();

			if (currentAddress) {
				if (currentAddress.skipped) {
					$scope.order.withdraw = (establishment.parameters && establishment.parameters.canWithdraw ? true : false);
					$scope.order.address = null;
				} else {
					$scope.order.withdraw = false;
					$scope.order.address = currentAddress;
				}
			} else {
				$scope.order.withdraw = false;
				$scope.order.address = null;
			}

			if ($scope.order.address) {
				EstablishmentService.isAttendingAddress(establishment, $scope.order.address).then(function(isAttending) {
					$scope.isUserAddressAttended = (isAttending ? true : false);
				});
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

		$scope.checkUserAddress = function(event) {
			if ($scope.order.withdraw) {
				return;
			}

			if (!$scope.order.address || !$scope.isUserAddressAttended) {
				if (event) {
					event.preventDefault();
				}

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
							$scope.order.address = response.address;
							$scope.isUserAddressAttended = response.isAttended;

							if (response.skipped) {
								$scope.order.withdraw = $scope.establishment.parameters.canWithdraw ? true : false;
							} else {
								$scope.order.withdraw = false;
							}

							$scope.$digest();
						}
					}
				});
			}
		};

		$scope.customizeProduct = function(product) {
			if ($scope.isUserAddressAttended === false) {
				$scope.checkUserAddress();
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
			return  OrderService.getOrderItemPrice(orderItem);;
		};

		$scope.finishOrder = function() {
			var confirmAddress = function() {
				$window.alert("Funcionalidade em desenvolvimento...");
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

		EstablishmentService.findByUrl($routeParams.establishmentUrl).then(function(establishment) {
			$scope.establishment = establishment;
			$scope.refreshOrder(establishment);

			$scope.$digest();

			EstablishmentService.products(establishment).then(function(products) {
				$scope.groupProducts(products);
			});
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

		$scope.calculateTotalPrice = function() {
			if (!$scope.product) {
				return 0;
			}

			var total = $scope.product.price || 0.0;

			for (var i in $scope.selectedFlavors) {
				var flavor = $scope.selectedFlavors[i];
				total += (flavor.price || 0.0)
			}

			if ($scope.product.components) {
				for (var i in $scope.product.components) {
					var component = $scope.product.components[i];

					if (typeof(component.value) !== "boolean" && component.defaultValue) {
						total += (component.price || 0.0);
					} else if (component.value) {
						total += (component.price || 0.0);
					} else if (component.option) {
						total += (component.option.price || 0.0);
					} else if (component.defaultOption) {
						total += (component.defaultOption.price || 0.0);
					}
				}
			}

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

	module.controller("CheckAddressController", ["$scope", "$location", "AddressService", "EstablishmentService", function($scope, $location, AddressService, EstablishmentService) {
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
				}
			}, function(errorMessage) {
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
				$scope.$dialog.beforeHide(function() {
					$location.path("/establishments/search/");
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