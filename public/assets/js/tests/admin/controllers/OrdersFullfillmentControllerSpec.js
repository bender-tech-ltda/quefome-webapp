"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/admin/controllers"], function(angular) {

	describe("OrdersFullfillmentController", function() {
		var scope, MockedOrderService;

		beforeEach(module("qfAdminControllers"));

		beforeEach(function() {
			MockedOrderService = {
				listCalled: false,
				_orders: [
					{date: new Date(), status: "OPEN"},
					{date: new Date(), status: "OPEN"},
					{date: new Date(), status: "PRODUCTION"}
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
			return injectController("OrdersFullfillmentController", "views/admin/partials/orders/fullfillment.html", {OrderService: MockedOrderService}, function($scope) {
				scope = $scope;
			})
		});

		it("should have a orders property", function() {
			expect(scope.orders).toBeDefined();
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
	});
});