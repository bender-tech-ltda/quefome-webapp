"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("EstablishmentController", function() {
		var scope, controller;
		var Mocked$routeParams, Mocked$window, Mocked$location, Mocked$timeout;
		var MockedDialog;
		var MockedAuthService, MockedEstablishmentService, MockedAddressService, MockedOrderService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			Mocked$routeParams = {
				establishmentUrl: "url-restaurante"
			};

			Mocked$window = {
				_confirmReturn: false,
				_confirmCalled: false, 
				confirm: function() {
					this._confirmCalled = true;
					return this._confirmReturn;
				},

				_alertCalled: false,
				alert: function() {
					this._alertCalled = true;
				}
			};

			Mocked$location = {
				_currentQuery: {},
				_currentLocation: "",

				path: function(location) {
					if (location) {
						this._currentLocation = location;
						return this;
					}
				}
			};

			Mocked$timeout = function(callback, time) {
				Mocked$timeout._called = true;
				Mocked$timeout._lastCallback = callback;
				Mocked$timeout._lastTime = time;
			};

			Mocked$timeout._called = false;
			Mocked$timeout._lastCallback = null;
			Mocked$timeout._lastTime = null;

			MockedDialog = {
				_called: false,
				_params: null,
				create: function(params) {
					this._called = true;
					this._params = params;
				}
			};

			MockedAuthService = {
				_currentUser: null,
				isLogged: function() {
					return this._currentUser ? true : false;
				}
			};

			MockedEstablishmentService = {
				findCalled: false,
				lastFindUrl: null,
				urlEstablishment: {id: -42, name: "Teste"},
				findByUrl: function(url) {
					this.findCalled = true;
					this.lastFindUrl = url;

					var establishment = this.urlEstablishment;

					return {
						then: function(callback) {
							callback(establishment);
						}
					};
				},

				productsCalled: false,
				lastEstablishment: null,
				_products: [{id: -42, name: "Pastel", type: {id: -1, name: "Pastel"}}],
				products: function(establishment) {
					this.productsCalled = true;
					this.lastEstablishment = establishment;

					var products = this._products;

					return {
						then: function(callback) {
							callback(products);
						}
					};
				},

				_isAttendingAddressCalled: false,
				_isAttendingAddressEstablishment: null,
				_isAttendingAddressAddress: null,
				_isAttendingAddressReturn: true,
				isAttendingAddress: function(establishment, address) {
					this._isAttendingAddressCalled = true;

					this._isAttendingAddressEstablishment = establishment;
					this._isAttendingAddressAddress = address;

					var that = this;

					return {
						then: function(callback) {
							callback(that._isAttendingAddressReturn);
						}
					};
				}
			};

			MockedAddressService = {
				_called: false,
				_currentAddress: null,
				getCurrentAddress: function() {
					this._called = true;
					return this._currentAddress;
				}
			};

			MockedOrderService = {
				_storedOrder: null,
				store: function(order) {
					this._storedOrder = order;
				},

				_retrieveOrder: {items: []},
				_retrievedEstablishment: null,
				retrieve: function(establishment) {
					this._retrievedEstablishment = establishment;
					return this._retrieveOrder;
				},

				_getOrderPriceCalled: false,
				_getOrderPriceOrder: null,
				_getOrderPriceWithDeliverTax: null,
				_getOrderPricePrice: 10.0,
				getOrderPrice: function(order, withDeliverTax) {
					this._getOrderPriceCalled = true;
					this._getOrderPriceOrder = order;
					this._getOrderPriceWithDeliverTax = withDeliverTax;

					return this._getOrderPricePrice;
				},

				_getOrderItemPriceCalled: false,
				_getOrderItemPriceOrderItem: null,
				getOrderItemPrice: function(orderItem) {
					this._getOrderItemPriceCalled = true;
					this._getOrderItemPriceOrderItem = orderItem;
				}
			};
		});

		beforeEach(function() {
			var params = {
				$routeParams: Mocked$routeParams,
				$window: Mocked$window,
				$location: Mocked$location,
				$timeout: Mocked$timeout,
				Dialog: MockedDialog,
				AuthService: MockedAuthService,
				EstablishmentService: MockedEstablishmentService,
				AddressService: MockedAddressService,
				OrderService: MockedOrderService
			};

			return injectController("EstablishmentController", "views/partials/establishments/establishment.html", params, function($scope) {
				scope = $scope;
			});
		});

		it("should have a establishment property", function() {
			expect(scope.establishment).toBeDefined();
		});

		it("should have a establishmentNotFound property", function() {
			expect(scope.establishmentNotFound).toBeDefined();
		});

		it("should have a productTypes property", function() {
			expect(scope.productTypes).toBeDefined();
		});

		it("should have a order property", function() {
			expect(scope.order).toBeDefined();
		});

		it("should have a orderDetailPanelOpen property", function() {
			expect(scope.orderDetailPanelOpen).toBeDefined();
		});

		it("should have a loadingEstablishment property", function() {
			expect(scope.loadingEstablishment).toBeDefined();
		});

		it("should have a loadingProducts property", function() {
			expect(scope.loadingProducts).toBeDefined();
		});

		describe("on startup", function() {
			it("should search for a establishment", function() {
				expect(MockedEstablishmentService.findCalled).toBe(true);
				expect(scope.establishment).toEqual(MockedEstablishmentService.urlEstablishment);
				expect(scope.order.establishment).toEqual(MockedEstablishmentService.urlEstablishment);
			});

			it("should search for a establishment using the $routeParams.establishmentUrl property", function() {
				expect(MockedEstablishmentService.lastFindUrl).toEqual(Mocked$routeParams.establishmentUrl);
			});

			it("should search for the establishment products", function() {
				expect(MockedEstablishmentService.productsCalled).toBe(true);
				expect(scope.productTypes.length).toEqual(MockedEstablishmentService._products.length);
			});

			it("should search for the establishment products using the current establishment", function() {
				expect(MockedEstablishmentService.lastEstablishment).toBe(MockedEstablishmentService.urlEstablishment);
			});

			it("should retrieve any stored order", function() {
				expect(scope.order).toEqual(MockedOrderService._retrieveOrder);
			});

			it("should check if the user already informed its address", function() {
				expect(MockedAddressService._called).toBe(true);
			});
		});

		describe("when formatting the schedule in international format", function() {
			var schedule;

			beforeEach(function() {
				schedule = {
					weekDay: {
						key: "sunday"
					},
					openingTime: new Date(),
					closingTime: new Date()
				};

				schedule.openingTime.setHours(10, 20);
				schedule.closingTime.setHours(14, 15);
			});

			it("should use the weekDay abbreviation", function() {
				var result;

				schedule.weekDay.key = "sunday";
				result = scope.formatScheduleInInternationalFormat(schedule);
				expect(result).toMatch("^Su");

				schedule.weekDay.key = "monday";
				result = scope.formatScheduleInInternationalFormat(schedule);
				expect(result).toMatch("^Mo");

				schedule.weekDay.key = "tuesday";
				result = scope.formatScheduleInInternationalFormat(schedule);
				expect(result).toMatch("^Tu");

				schedule.weekDay.key = "wednesday";
				result = scope.formatScheduleInInternationalFormat(schedule);
				expect(result).toMatch("^We");

				schedule.weekDay.key = "thursday";
				result = scope.formatScheduleInInternationalFormat(schedule);
				expect(result).toMatch("^Th");

				schedule.weekDay.key = "friday";
				result = scope.formatScheduleInInternationalFormat(schedule);
				expect(result).toMatch("^Fr");

				schedule.weekDay.key = "saturday";
				result = scope.formatScheduleInInternationalFormat(schedule);
				expect(result).toMatch("^Sa");
			});

			it("should parse the openingTime and closingTime in HH:mm format", function() {
				schedule.openingTime.setHours(10, 20);
				schedule.closingTime.setHours(23, 30);

				var result = scope.formatScheduleInInternationalFormat(schedule);
				expect(result).toContain("10:20-23:30");
			});
		});

		describe("when refreshing the order", function() {
			it("should retrieve any stored order", function() {
				MockedOrderService._retrieveOrder = {items: []};

				scope.refreshOrder();
				expect(scope.order).toEqual(MockedOrderService._retrieveOrder);
			});

			it("should set the order.establishment", function() {
				var establishment = {id: -2};

				scope.refreshOrder(establishment);
				expect(scope.order.establishment).toEqual(establishment);
			});

			it("should set the order.withdraw to false if the user didn't informed it's address", function() {
				MockedAddressService._currentAddress = null;
				scope.refreshOrder();

				expect(scope.order.withdraw).toBe(false);
			});

			it("should set the order.address to null if the user didn't informed it's address", function() {
				MockedAddressService._currentAddress = null;
				scope.refreshOrder();

				expect(scope.order.address).toBeNull();
			});

			it("should set the order.withdraw based on the stored order and the establishment parameters", function() {
				MockedAddressService._currentAddress = {blabla: "asdasdasd"};
				
				MockedOrderService._retrieveOrder = {withdraw: true};
				scope.refreshOrder({parameters: {canWithdraw: true}});
				expect(scope.order.withdraw).toBe(true);

				MockedOrderService._retrieveOrder = {withdraw: true};
				scope.refreshOrder({parameters: {canWithdraw: false}});
				expect(scope.order.withdraw).toBe(false);

				MockedOrderService._retrieveOrder = {withdraw: false};
				scope.refreshOrder({parameters: {canWithdraw: true}});
				expect(scope.order.withdraw).toBe(false);
			});

			it("should set the order.address based on the stored order and the user address", function() {
				scope.order.address = {address: "asdasd"};

				MockedOrderService._retrieveOrder = {withdraw: false};
				scope.refreshOrder();
				expect(scope.order.address).toBeNull();

				scope.order.address = {address: "asdasd"};

				MockedAddressService._currentAddress = {skipped: true};
				scope.refreshOrder();
				expect(scope.order.address).toBeNull();

				scope.order.address = {address: "asdasd"};

				MockedAddressService._currentAddress = {address: "teste"};
				scope.refreshOrder();
				expect(scope.order.address).toEqual(MockedAddressService._currentAddress);
			});

			it("should verify the user address if the order has an address", function() {
				MockedAddressService._currentAddress = {address: "blabla"};
				var establishment = {id: -2};

				scope.refreshOrder(establishment);
				expect(MockedEstablishmentService._isAttendingAddressCalled).toBe(true);
				expect(MockedEstablishmentService._isAttendingAddressEstablishment).toBe(establishment);
				expect(MockedEstablishmentService._isAttendingAddressAddress).toBe(MockedAddressService._currentAddress);

				expect(scope.isUserAddressAttended).toBe(MockedEstablishmentService._isAttendingAddressReturn);
			});

			it("should not verify the user address if the order have no address", function() {
				var establishment = {id: -2};

				MockedAddressService._currentAddress = null;
				scope.refreshOrder(establishment);
				expect(MockedEstablishmentService._isAttendingAddressCalled).toBe(false);

				MockedAddressService._currentAddress = {skipped: true};
				scope.refreshOrder(establishment);
				expect(MockedEstablishmentService._isAttendingAddressCalled).toBe(false);
			});

			it("should call the refresh parameters function", function() {
				var called = false;

				scope.refreshParameters = function() {
					called = true;
				};

				scope.refreshOrder({id: -2})
				expect(called).toBe(true);
			});
		});

		describe("when refreshing the parameters", function() {
			it("should call the $timeout service", function() {
				Mocked$timeout._called = false;
				scope.refreshParameters();

				expect(Mocked$timeout._called).toBe(true);
			});

			it("should the use EstablishmentService to get the parameters", function() {
				MockedEstablishmentService.findCalled = false;
				MockedEstablishmentService._findByUrlEstablishment = {parameters: {deliverTax: 10}};

				scope.establishment = {id: -44, url: "blabla"};

				scope.refreshParameters();
				Mocked$timeout._lastCallback();

				expect(MockedEstablishmentService.findCalled).toBe(true);
				expect(MockedEstablishmentService.lastFindUrl).toBe("blabla");
				expect(scope.establishment).toEqual(MockedEstablishmentService.urlEstablishment);
			});
		});

		describe("when updating the page info", function() {
			it("should set as not found if the establishment was not found", function() {
				scope.$app.info = {};
				scope.establishmentNotFound = true;

				scope.updatePageInfo();

				expect(scope.$app.info.title).toContain("não encontrado");
				expect(scope.$app.info.largeImage).toBe(false);
			});

			it("should use the establishment info when found", function() {
				scope.$app.info = {};
				scope.establishmentNotFound = false;
				scope.establishment = {
					name: "Pudim",
					description: "É bom",
					imageUrl: "http://imagem_bacana.jpg"
				};

				scope.updatePageInfo();

				expect(scope.$app.info.title).toContain("Pudim");
				expect(scope.$app.info.description).toEqual("É bom");
				expect(scope.$app.info.imageUrl).toEqual("http://imagem_bacana.jpg");
			});
		});

		describe("when checking for user address", function() {
			it("should not show a dialog if the user will withdraw the order", function() {
				scope.order.withdraw = true;
				scope.checkUserAddress();

				expect(MockedDialog._called).toBe(false);
			});

			it("should show a dialog if the order address is null", function() {
				scope.order.address = null;
				scope.checkUserAddress();

				expect(MockedDialog._called).toBe(true);
			});

			it("should show a dialog if the user address is invalid", function() {
				scope.order.address = {address: "teste"};
				scope.isUserAddressAttended = false;
				scope.checkUserAddress();

				expect(MockedDialog._called).toBe(true);
			});

			it("should not show a dialog if the user address is valid", function() {
				scope.order.address = {address: "teste"};
				scope.isUserAddressAttended = true;
				scope.checkUserAddress();

				expect(MockedDialog._called).toBe(false);
			});

			it("should set order address with the response from the dialog", function() {
				scope.checkUserAddress();

				expect(MockedDialog._params.onResponse).toBeDefined();

				var response = {address: {address: ""}};
				MockedDialog._params.onResponse(response);

				expect(scope.order.address).toEqual(response.address);
			});

			it("should set the isUserAddressAttended with the response from the dialog", function() {
				scope.checkUserAddress();
				var response = {address: {address: ""}, isAttended: true};
				MockedDialog._params.onResponse(response);

				expect(scope.isUserAddressAttended).toBe(true);
			});

			it("should set the order withdraw with establishment.parameters.canWithdraw and the response from the dialog", function() {
				scope.establishment = {
					parameters: {canWithdraw: true}
				};

				scope.checkUserAddress();

				MockedDialog._params.onResponse({skipped: true});
				expect(scope.order.withdraw).toBe(true);

				scope.establishment.parameters.canWithdraw = false;
				MockedDialog._params.onResponse({skipped: true});
				expect(scope.order.withdraw).toBe(false);

				scope.establishment.parameters.canWithdraw = true;
				MockedDialog._params.onResponse({skipped: false});
				expect(scope.order.withdraw).toBe(false);
			});

			it("should store the current order with the response from the dialog", function() {
				MockedOrderService._storedOrder = null;
				scope.order = {blabla: "adsasd"};

				scope.checkUserAddress();
				MockedDialog._params.onResponse({skipped: true});
				
				expect(MockedOrderService._storedOrder).toEqual(scope.order);
			});

			it("should call a callback when the dialog respond", function() {
				var called = false;

				scope.checkUserAddress(function() {
					called = true;
				});

				MockedDialog._params.onResponse({});
				expect(called).toBe(true);
			});
		});

		describe("when grouping products", function() {
			var products;

			beforeEach(function() {
				products = [
					{id: -1, name: "Pizza Grande", type: {id: -1, name: "Pizza"}},
					{id: -2, name: "Pizza Média", type: {id: -1, name: "Pizza"}},
					{id: -3, name: "Xis Salada", type: {id: -2, name: "Xis"}}
				];
			});

			it("should group by productType", function() {
				scope.groupProducts(products);

				expect(scope.productTypes.length).toEqual(2);
				expect(scope.productTypes[0].products.length).toEqual(2);
				expect(scope.productTypes[1].products.length).toEqual(1);
			});
		});

		describe("when toggling a productType", function() {
			it("should set the selectedProductType", function() {
				var productType = {id: -1, name: "Teste"};
				scope.toggleProductType(productType);

				expect(scope.selectedProductType).toEqual(productType);
			});

			it("should set the selectedProductType to null if the toggled productType is equal to the selectedProductType", function() {
				scope.selectedProductType = {id: -1, name: "Teste"};

				scope.toggleProductType(scope.selectedProductType);
				expect(scope.selectedProductType).toBeNull();
			});
		});

		describe("when checking if a productType is selected", function() {
			it("should return true if the selectedProductType is equal to the productType informed", function() {
				scope.selectedProductType = {id: -1, name: "Teste"};
				expect(scope.isProductTypeSelected(scope.selectedProductType)).toBe(true);
			});

			it("should return false if the selectedProductType is not equal to the productType informed", function() {
				scope.selectedProductType = {id: -1, name: "Teste"};
				expect(scope.isProductTypeSelected({id: -2, name: "Teste 2"})).toBe(false);
			});
		});

		describe("when customizing the selected product", function() {
			it("should show a dialog", function() {
				scope.customizeProduct();
				expect(MockedDialog._called).toBe(true);
			});

			it("should not show the dialog if the user informed its address but it is not attended", function() {
				scope.isUserAddressAttended = false;
				scope.order.address = {address: "Blablabla"};

				scope.customizeProduct();

				expect(MockedDialog._params.templateUrl.indexOf("customize")).toEqual(-1);
			});

			it("should pass a product as a parameter to the dialog", function() {
				var product = {id: -2, name: "Produto de Teste"};

				scope.customizeProduct(product);
				expect(MockedDialog._params.params.product).toEqual(product);
			});

			it("should expect a orderItem in return", function() {
				var product = {id: -2, name: "Produto de Teste"};
				scope.customizeProduct(product);

				expect(MockedDialog._params.onResponse).toBeDefined();

				var orderItem = {product: product};
				MockedDialog._params.onResponse(orderItem);

				expect(scope.order.items[0]).toEqual(orderItem);
			});

			it("should store the order after customizing", function() {
				var product = {id: -2, name: "Produto de Teste", establishment: {id: -10}};
				scope.customizeProduct(product);
				MockedDialog._params.onResponse({product: product});

				expect(MockedOrderService._storedOrder).toEqual(scope.order);
			});

			it("should check user user address after customizing", function() {
				var checkCalled = false;
				scope.checkUserAddress = function() {
					checkCalled = true;
				};

				var product = {id: -2, name: "Produto de Teste", establishment: {id: -10}};
				scope.customizeProduct(product);
				MockedDialog._params.onResponse({product: product});

				expect(checkCalled).toEqual(true);
			});

			it("should be called again if the user informed it's address and then change it", function() {
				scope.isUserAddressAttended = false;
				scope.order.address = {address: "Blablabla"};

				var called = false;
				scope.checkUserAddress = function(callback) {
					scope.customizeProduct = function() {
						called = true;
					};

					scope.order.withdraw = true;
					callback({});
				};

				scope.customizeProduct();
				expect(called).toBe(true);
			});
		});

		describe("when toggling the order detail panel", function() {
			it("should set the orderDetailPanelOpen to true if it is false", function() {
				scope.orderDetailPanelOpen = false;
				scope.toggleOrderDetailPanel();

				expect(scope.orderDetailPanelOpen).toBe(true);
			});

			it("should set the orderDetailPanelOpen to false if it is true", function() {
				scope.orderDetailPanelOpen = true;
				scope.toggleOrderDetailPanel();

				expect(scope.orderDetailPanelOpen).toBe(false);
			});

			it("should set the orderDetailPanelOpen to false if the $locationChangeStart is fired", function() {
				scope.orderDetailPanelOpen = true;
				scope.$broadcast("$locationChangeStart");

				expect(scope.orderDetailPanelOpen).toBe(false);
			});
		});

		describe("when getting the order total price", function() {
			it("should call the OrderService to get the total price", function() {
				scope.getOrderTotalPrice();
				expect(MockedOrderService._getOrderPriceCalled).toBe(true);
			});

			it("should pass the current order as parameter", function() {
				scope.order = {};
				scope.getOrderTotalPrice();

				expect(MockedOrderService._getOrderPriceOrder).toEqual(scope.order);
			});
		});

		describe("when getting the order item price", function() {
			it("should call the OrderService to get the price", function() {
				scope.getOrderItemPrice({});
				expect(MockedOrderService._getOrderItemPriceCalled).toBe(true);
			});

			it("should accept a orderItem as parameter", function() {
				var orderItem = {product: {id: -2}};
				scope.getOrderItemPrice(orderItem);

				expect(MockedOrderService._getOrderItemPriceOrderItem).toEqual(orderItem);
			});
		});

		describe("when editing an order item", function() {
			it("should call the order item dialog", function() {
				scope.editOrderItem({});
				expect(MockedDialog._called).toBe(true);
			});

			it("should pass the order item as a parameter to the dialog", function() {
				var orderItem = {product: {id: -2, name: "Produto de Teste"}};

				scope.editOrderItem(orderItem);
				expect(MockedDialog._params.params.orderItem).toEqual(orderItem);
			});

			it("should receive an order item as return", function() {
				var orderItem = {product: {id: -2, name: "Produto de Teste"}};
				scope.order = {
					items: [orderItem]
				};

				scope.editOrderItem(orderItem);
				expect(MockedDialog._params.onResponse).toBeDefined();

				var modifiedOrderItem = {product: {id: -2}, components: []};
				MockedDialog._params.onResponse(modifiedOrderItem);

				expect(scope.order.items[0]).toEqual(modifiedOrderItem);
			});

			it("should store the order after customizing", function() {
				var orderItem = {product: {id: -2, name: "Produto de Teste"}};
				scope.order = {
					items: [orderItem]
				};

				scope.editOrderItem(orderItem);
				MockedDialog._params.onResponse({product: {id: -2}, components: []});
				
				expect(MockedOrderService._storedOrder).toEqual(scope.order);
			});
		});

		describe("when removing an order item", function() {
			it("should ask confirmation to the user", function() {
				scope.removeOrderItem({});
				expect(Mocked$window._confirmCalled).toBe(true);
			});

			it("should remove from the order.items", function() {
				Mocked$window._confirmReturn = true;

				var orderItem = {product: {id: -2}};
				scope.order = {
					items: [orderItem]
				};

				scope.removeOrderItem(orderItem);
				expect(scope.order.items.length).toEqual(0);
			});

			it("should store the current order", function() {
				Mocked$window._confirmReturn = true;

				var orderItem = {product: {id: -2}};
				scope.order = {
					items: [orderItem]
				};

				scope.removeOrderItem(orderItem);
				expect(MockedOrderService._storedOrder).toEqual(scope.order);
			});
		});

		describe("when checking if order is invalid", function() {
			beforeEach(function() {
				scope.establishment = {
					parameters: {
						status: "OPEN",
						minimumOrderValue: 10.0,
						deliverTax: 5.0
					}
				};

				scope.order = {
					items: [{}]
				};
			});

			it("should return true if the establishment is closed", function() {
				scope.establishment.parameters.status = "CLOSED";
				var result = scope.isOrderInvalid();
				expect(result).toBe(true);

				scope.establishment.parameters.status = "OPEN";
				result = scope.isOrderInvalid();
				expect(result).toBe(false);
			});

			it("should return true if the current order price (withow the delivery price) is lower then the establishment minimum value", function() {
				scope.establishment.parameters.minimumOrderValue = 10;

				MockedOrderService._getOrderPricePrice = 5.0
				var result = scope.isOrderInvalid();
				expect(result).toBe(true);

				MockedOrderService._getOrderPricePrice = 10.0
				result = scope.isOrderInvalid();
				expect(result).toBe(false);

				expect(MockedOrderService._getOrderPriceWithDeliverTax).toBe(false);
			});

			it("should return true if the current order has no items", function() {
				scope.establishment.parameters.minimumOrderValue = 0;
				scope.order.items = [];

				var result = scope.isOrderInvalid();
				expect(result).toBe(true);

				scope.order.items = [{}];
				result = scope.isOrderInvalid();
				expect(result).toBe(false);
			});
		});

		describe("when getting the invalid order message", function() {
			beforeEach(function() {
				scope.establishment = {
					parameters: {
						status: "OPEN",
						minimumOrderValue: 10.0,
						deliverTax: 5.0
					}
				};

				scope.order = {
					items: [{}]
				};
			});

			it("should return a message if the establishment is closed", function() {
				scope.establishment.parameters.status = "CLOSED";
				var result = scope.getInvalidOrderMessage();
				expect(result.length).toBeGreaterThan(0);

				scope.establishment.parameters.status = "OPEN";
				result = scope.getInvalidOrderMessage();
				expect(result).toEqual("");
			});

			it("should return a message if the current order price (withow the delivery price) is lower then the establishment minimum value", function() {
				scope.establishment.parameters.minimumOrderValue = 10;

				MockedOrderService._getOrderPricePrice = 5.0
				var result = scope.getInvalidOrderMessage();
				expect(result.length).toBeGreaterThan(0);

				MockedOrderService._getOrderPricePrice = 10.0
				result = scope.getInvalidOrderMessage();
				expect(result).toEqual("");
			});

			it("should return a message if the current order has no items", function() {
				scope.establishment.parameters.minimumOrderValue = 0;
				scope.order.items = [];

				var result = scope.getInvalidOrderMessage();
				expect(result.length).toBeGreaterThan(0);

				scope.order.items = [{}];
				result = scope.getInvalidOrderMessage();
				expect(result).toEqual("");
			});
		});

		describe("when finishing the order", function() {
			it("should show the login dialog if the user is not logged in", function() {
				MockedAuthService._currentUser = null;
				scope.finishOrder();

				expect(MockedDialog._called).toBe(true);
			});

			it("should send the user to the finish order page", function() {
				scope.establishment = {url: "teste"};

				MockedAuthService._currentUser = null;
				scope.finishOrder();

				MockedDialog._params.onResponse({name: "Blablabla"});
				expect(scope.orderDetailPanelOpen).toBe(false);
				expect(Mocked$location._currentLocation).toEqual("/teste/pedido/finalizar/");
			});

			it("should store the current order", function() {
				scope.establishment = {url: "teste"};
				MockedAuthService._currentUser = {name: "Blablabla"};
				
				MockedOrderService._storedOrder = null;

				scope.order = {product: {id: -2}};
				scope.finishOrder();

				expect(MockedOrderService._storedOrder).toEqual(scope.order);
			});

			it("should show an alert if the user is already logged", function() {
				scope.establishment = {url: "teste"};

				MockedAuthService._currentUser = {name: "Blablabla"};
				scope.finishOrder();

				expect(scope.orderDetailPanelOpen).toBe(false);
				expect(Mocked$location._currentLocation).toEqual("/teste/pedido/finalizar/");
			});
		});
	});
});