"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/admin/controllers"], function(angular) {

	describe("OrdersFullfillmentController", function() {
		var scope;
		var Mocked$timeout;
		var MockedDialog;
		var MockedOrderService;

		beforeEach(module("qfAdminControllers"));

		beforeEach(function() {
			Mocked$timeout = function(callback, time) {
				Mocked$timeout.whenCalling(callback, time);
			};
			Mocked$timeout.whenCalling = function() {};

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

		beforeEach(function() {
			var params = {
				$timeout: Mocked$timeout,
				Dialog: MockedDialog,
				OrderService: MockedOrderService
			};

			return injectController("OrdersFullfillmentController", "views/admin/partials/orders/fullfillment.html", params, function($scope) {
				scope = $scope;

				scope.$digest = function(callback) {
					if (typeof(callback) === "function") {
						callback();
					}
				};
			});
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

		it("should get a list of orders on startup", function() {
			expect(MockedOrderService.listCalled).toBe(true);
			expect(scope.orders).toEqual(MockedOrderService._orders);
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
			it("should put the incoming orders in a cache", function() {
				scope.checkIncomingOrders();
				expect(scope.cachedOrders).toEqual(MockedOrderService._orders);
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
		})
	});
});