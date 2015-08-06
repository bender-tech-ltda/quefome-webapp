"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/admin/controllers"], function(angular) {

	describe("OrdersFullfillmentController", function() {
		var scope;
		var Mocked$timeout, Mocked$notification;
		var MockedDialog;
		var MockedOrderService;

		beforeEach(module("qfAdminControllers"));

		beforeEach(function() {
			Mocked$timeout = function(callback, time) {
				Mocked$timeout.whenCalling(callback, time);
			};
			Mocked$timeout.whenCalling = function() {};

			Mocked$notification = {
				_requestPermissionCalled: false,
				requestPermission: function() {
					this._requestPermissionCalled = true;
				},

				_notifyCalled: false,
				_notifyTitle: null,
				_notifyMessage: null,
				_notifyOptions: null,
				notify: function(title, message, options) {
					this._notifyCalled = true;

					this._notifyTitle = title;
					this._notifyMessage = message;
					this._notifyOptions = options;
				}
			};

			MockedDialog = {
				_createCalled: false,
				_createOptions: null,
				create: function(options) {
					this._createCalled = true;
					this._createOptions = options;
				}
			};

			MockedOrderService = {
				listCalled: false,
				_orders: [
					{id: -1, date: new Date(), status: "OPEN"},
					{id: -2, date: new Date(), status: "OPEN"},
					{id: -3, date: new Date(), status: "PRODUCTION"}
				],

				list: function() {
					this.listCalled = true;
					var that = this;

					return {
						then: function(callback) {
							callback(that._orders);
						}
					};
				}
			};
		});

		beforeEach(inject(function($rootScope) {
			scope = $rootScope.$new();

			scope._$watchCalled = false;
			scope._$watchProperty = null;
			scope._$watchCallback = null;
			scope.$watch = function(property, callback) {
				console.log(property);

				scope._$watchCalled = true;
				scope._$watchProperty = property;
				scope._$watchCallback = callback;
			};

			scope.$digest = function(callback) {
				if (typeof(callback) === "function") {
					callback();
				}
			};
		}));

		beforeEach(function() {
			var params = {
				$timeout: Mocked$timeout,
				$notification: Mocked$notification,
				Dialog: MockedDialog,
				OrderService: MockedOrderService,
				$scope: scope
			};

			return injectController("OrdersFullfillmentController", "views/admin/partials/orders/fullfillment.html", params);
		});

		it("should have a orders property", function() {
			expect(scope.orders).toBeDefined();
		});

		it("should have a secondsToCheckForIncomingOrders property", function() {
			expect(scope.secondsToCheckForIncomingOrders).toBeDefined();
		});

		it("should have a cachedOrders property", function() {
			expect(scope.cachedOrders).toBeDefined();
		});

		it("should have a numberOfIncomingOrders property", function() {
			expect(scope.numberOfIncomingOrders).toBeDefined();
		});

		it("should have a numberOfModifiedOrders property", function() {
			expect(scope.numberOfModifiedOrders).toBeDefined();
		});

		it("should have a loadedOrders property", function() {
			expect(scope.loadedOrders).toBeDefined();
		});

		it("should get a list of orders on startup", function() {
			expect(MockedOrderService.listCalled).toBe(true);
			expect(scope.orders).toEqual(MockedOrderService._orders);
		});

		it("should use $watch to check for orders status", function() {
			var called = false;
			scope.indicateOpenOrders = function() {
				called = true;
			};

			expect(scope._$watchCalled).toBe(true);
			expect(typeof(scope._$watchProperty)).toEqual("function");

			scope._$watchCallback();
			expect(called).toBe(true);
		});

		describe("when showing order details", function() {
			it("should show a dialog", function() {
				MockedDialog._createCalled = false;
				scope.showOrderDetails({});
				expect(MockedDialog._createCalled).toBe(true);
			});

			it("should pass a order as parameter to the dialog", function() {
				var order = {id: -1};
				scope.showOrderDetails(order);

				expect(MockedDialog._createOptions.params.order).toEqual(order);
			});
		});

		describe("when checking incoming orders", function() {
			beforeEach(function() {
				scope.loadedOrders = true;
			});

			it("should put the incoming orders in a cache", function() {
				scope.checkIncomingOrders();
				expect(scope.cachedOrders).toEqual(MockedOrderService._orders);
			});

			it("should check if the orders are already loaded and set the orders", function() {
				scope.orders = null;
				scope.loadedOrders = false;

				scope.checkIncomingOrders();				
				expect(scope.orders).toEqual(MockedOrderService._orders);

				scope.loadedOrders = true;
				
				scope.checkIncomingOrders();
				expect(scope.cachedOrders).toEqual(MockedOrderService._orders);
			});

			it("should set the loadedOrders to true", function() {
				scope.loadedOrders = false;
				scope.checkIncomingOrders();

				expect(scope.loadedOrders).toBe(true);
			});

			it("should count how many incoming open orders exists", function() {
				MockedOrderService._orders = angular.copy(MockedOrderService._orders);
				MockedOrderService._orders.push({id: -4, date: new Date(), status: "OPEN"});

				scope.checkIncomingOrders();
				expect(scope.numberOfIncomingOrders).toEqual(1);
			});

			it("and not count for the incoming production orders", function() {
				MockedOrderService._orders = angular.copy(MockedOrderService._orders);
				MockedOrderService._orders.push({id: -4, date: new Date(), status: "PRODUCTION"});

				scope.checkIncomingOrders();
				expect(scope.numberOfIncomingOrders).toEqual(0);
			});

			it("should count how many modified orders exists", function() {
				MockedOrderService._orders = angular.copy(MockedOrderService._orders);
				MockedOrderService._orders[0].status = "PRODUCTION";

				scope.checkIncomingOrders();

				expect(scope.numberOfModifiedOrders).toEqual(1);
			});

			it("should count how many removed or delivered orders exists", function() {
				MockedOrderService._orders = [];
				scope.orders = [{id: -1, date: new Date(), status: "PRODUCTION"}];

				scope.checkIncomingOrders();

				expect(scope.numberOfModifiedOrders).toEqual(1);
			});

			it("should not count the modified orders coming from the server if the order was delivered locally", function() {
				MockedOrderService._orders = [];
				scope.orders = [{id: -1, date: new Date(), status: "DELIVERED"}];

				scope.checkIncomingOrders();

				expect(scope.numberOfModifiedOrders).toEqual(0);
			});

			it("should check for incoming orders from time to time", function() {
				var called = false;
				var time = null;
				
				Mocked$timeout.whenCalling = function(func, _time) {
					called = true;
					time = _time;
				};

				scope.checkIncomingOrders();

				expect(called).toBe(true);
				expect(time).toBeGreaterThan(0);
			});

			it("should check for incoming orders from time to time event if it failed", function() {
				MockedOrderService.list = function() {
					return {
						then: function(success, fail) {
							fail();
						}
					};
				};

				var called = false;
				var time = null;

				Mocked$timeout.whenCalling = function(func, _time) {
					called = true;
					time = _time;
				};

				scope.checkIncomingOrders();

				expect(called).toBe(true);
				expect(time).toBeGreaterThan(0);
			});

			it("should indicate the number of open orders", function() {
				var called = true;
				scope.indicateOpenOrders = function() {
					called = true;
				};

				scope.checkIncomingOrders();
				expect(called).toBe(true);
			});

			it("should notify the user of something", function() {
				var called = true;
				scope.notifyUser = function() {
					called = true;
				};

				scope.checkIncomingOrders();
				expect(called).toBe(true);
			});
		});

		describe("when indicating open orders", function() {
			beforeEach(function() {
				scope.$app = {
					info: {titlePrefix: ""}
				};
			});

			it("should use the current orders and show the number in the title", function() {
				scope.orders = [
					{id: -1, date: new Date(), status: "OPEN"},
					{id: -2, date: new Date(), status: "DELIVERED"}
				];

				scope.indicateOpenOrders();
				expect(scope.$app.info.titlePrefix).toContain("(1)");

				scope.orders = [
					{id: -1, date: new Date(), status: "OPEN"},
					{id: -2, date: new Date(), status: "DELIVERED"},
					{id: -3, date: new Date(), status: "OPEN"},
				];

				scope.indicateOpenOrders();
				expect(scope.$app.info.titlePrefix).toContain("(2)");
			});

			it("should use the cached orders over the current orders", function() {
				scope.orders = [
					{id: -1, date: new Date(), status: "OPEN"}
				];

				scope.cachedOrders = [
					{id: -1, date: new Date(), status: "OPEN"},
					{id: -2, date: new Date(), status: "OPEN"},
					{id: -3, date: new Date(), status: "OPEN"}
				];

				scope.indicateOpenOrders();
				expect(scope.$app.info.titlePrefix).toContain("(3)");
			});

			it("should show nothing if no open orders", function() {
				scope.orders = [];
				scope.cachedOrders = null;

				scope.indicateOpenOrders();
				expect(scope.$app.info.titlePrefix).toBe(null);
			});
		});

		describe("when notifying the user", function() {
			beforeEach(function() {
				scope.numberOfIncomingOrders = 0;
				scope.orders = [];
			});

			it("should notify if it has opened orders", function() {
				Mocked$notification._notifyCalled = false;
				
				scope.orders = [
					{id: -1, date: new Date(), status: "OPEN"},
					{id: -2, date: new Date(), status: "DELIVERED"}
				];
				scope.notifyUser();
				expect(Mocked$notification._notifyCalled).toBe(true);
				expect(Mocked$notification._notifyMessage).toContain("aberto ");
				expect(Mocked$notification._notifyOptions.showIfNoFocus).toBe(true);

				Mocked$notification._notifyCalled = false;
				
				scope.orders = [
					{id: -1, date: new Date(), status: "OPEN"},
					{id: -2, date: new Date(), status: "DELIVERED"},
					{id: -3, date: new Date(), status: "OPEN"}
				];
				scope.notifyUser();
				expect(Mocked$notification._notifyCalled).toBe(true);
				expect(Mocked$notification._notifyMessage).toContain("abertos");
				expect(Mocked$notification._notifyOptions.showIfNoFocus).toBe(true);
			});

			it("should notify if it has incoming orders", function() {
				Mocked$notification._notifyCalled = false;
				
				scope.numberOfIncomingOrders = 1;
				scope.notifyUser();
				expect(Mocked$notification._notifyCalled).toBe(true);
				expect(Mocked$notification._notifyMessage).toContain("novo pedido");
				expect(Mocked$notification._notifyOptions.showIfNoFocus).toBe(true);

				Mocked$notification._notifyCalled = false;

				scope.numberOfIncomingOrders = 2;
				scope.notifyUser();
				expect(Mocked$notification._notifyCalled).toBe(true);
				expect(Mocked$notification._notifyMessage).toContain("novos pedidos");
				expect(Mocked$notification._notifyOptions.showIfNoFocus).toBe(true);
			});

			it("should notify if it has modified orders", function() {
				Mocked$notification._notifyCalled = false;
				
				scope.numberOfModifiedOrders = 1;
				scope.notifyUser();
				expect(Mocked$notification._notifyCalled).toBe(true);
				expect(Mocked$notification._notifyMessage).toContain("alterado ");
				expect(Mocked$notification._notifyOptions.showIfNoFocus).toBe(true);

				Mocked$notification._notifyCalled = false;

				scope.numberOfModifiedOrders = 2;
				scope.notifyUser();
				expect(Mocked$notification._notifyCalled).toBe(true);
				expect(Mocked$notification._notifyMessage).toContain("alterados");
				expect(Mocked$notification._notifyOptions.showIfNoFocus).toBe(true);
			});
		});

		describe("when updating orders with cached orders", function() {
			it("should set cached orders into the orders list", function() {
				scope.orders = MockedOrderService._orders;
				scope.cachedOrders = angular.copy(scope.orders);
				scope.cachedOrders.push({id: -4, date: new Date(), status: "OPEN"});

				expect(scope.orders).not.toEqual(scope.cachedOrders);

				scope.updateOrdersWithCachedOrders();
				expect(scope.orders).toEqual(scope.cachedOrders);				
			});

			it("should set the number of incoming and modified orders to 0", function() {
				scope.numberOfIncomingOrders = 666;
				scope.updateOrdersWithCachedOrders();

				expect(scope.numberOfIncomingOrders).toEqual(0);
				expect(scope.numberOfModifiedOrders).toEqual(0);
			});
		});
	});
});