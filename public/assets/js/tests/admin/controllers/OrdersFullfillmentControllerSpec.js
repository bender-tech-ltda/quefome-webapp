"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/admin/controllers"], function(angular) {

	describe("OrdersFullfillmentController", function() {
		var scope, Mocked$timeout, MockedOrderService;

		beforeEach(module("qfAdminControllers"));

		beforeEach(function() {
			Mocked$timeout = function(callback, time) {
				Mocked$timeout.whenCalling(callback, time);
			};
			Mocked$timeout.whenCalling = function() {};

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
				},

				lastUpdatedOrder: false,
				updateCheckedFunction: function() {},
				update: function(order) {
					this.lastUpdatedOrder = order;
					this.updateCheckedFunction(order);

					return {
						then: function(callback) {
							callback(order);
						}
					};
				}
			};
		});

		beforeEach(function() {
			var params = {
				$timeout: Mocked$timeout,
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

		describe("when sending an order to production", function() {
			it("should set the order.status to PRODUCTION", function() {
				var myOrder = {id: -5};
				scope.sendOrderToProduction(myOrder);

				expect(MockedOrderService.lastUpdatedOrder.status).toEqual('PRODUCTION');
			});

			it("should set the order.changingStatus to true", function() {
				var myOrder = {id: -5};
				MockedOrderService.updateCheckedFunction = function() {
					expect(myOrder.changingStatus).toBe(true);
				};

				scope.sendOrderToProduction(myOrder);

				expect(myOrder.changingStatus).toBe(false);
			});
		});

		describe("when marking an order as delivered", function() {
			it("should set the order.status to DELIVERED", function() {
				var myOrder = {id: -5};
				scope.markAsDelivered(myOrder);

				expect(MockedOrderService.lastUpdatedOrder.status).toEqual('DELIVERED');
			});

			it("should set the order.changingStatus to true", function() {
				var myOrder = {id: -5};
				MockedOrderService.updateCheckedFunction = function() {
					expect(myOrder.changingStatus).toBe(true);
				};

				scope.markAsDelivered(myOrder);

				expect(myOrder.changingStatus).toBe(false);
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

			it("should check for incoming orders from time to time", function() {
				Mocked$timeout.whenCalling = function(func, time) {
					expect(time).toBeDefined();
					expect(time).toBeGreaterThan(0);
				};

				scope.checkIncomingOrders();
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