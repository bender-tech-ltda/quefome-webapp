"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/admin/controllers"], function(angular) {

	describe("OrdersFullfillmentController", function() {
		var scope, MockedOrderService;

		beforeEach(module("qfAdminControllers"));

		beforeEach(function() {
			MockedOrderService = {
				called: false,
				_orders: [
					{date: new Date(), status: "OPEN"},
					{date: new Date(), status: "OPEN"},
					{date: new Date(), status: "PRODUCTION"}
				],

				list: function() {
					this.called = true;
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
			return injectController("OrdersFullfillmentController", "views/admin/partials/orders/fullfillment.html", {OrderService: MockedOrderService}, function($scope) {
				scope = $scope;
			})
		});

		it("should have a orders property", function() {
			expect(scope.orders).toBeDefined();
		});

		it("should get a list of orders on startup", function() {
			expect(MockedOrderService.called).toBe(true);
			expect(scope.orders).toEqual(MockedOrderService._orders);
		});
	});
});