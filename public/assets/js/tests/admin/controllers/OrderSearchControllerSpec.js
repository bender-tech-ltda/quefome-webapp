"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/admin/controllers"], function(angular) {

	describe("OrderSearchController", function() {
		var scope;
		var MockedOrderService;

		beforeEach(module("qfAdminControllers"));

		beforeEach(function() {
			MockedOrderService = {
			};			
		});

		beforeEach(function() {
			var params = {
				OrderService: MockedOrderService
			};

			return injectController("OrderSearchController", "views/admin/partials/orders/search.html", params, function($scope) {
				scope = $scope;
			})
		});

		it("should have a orders property", function() {
			expect(scope.orders).toBeDefined();
		});
	});
});