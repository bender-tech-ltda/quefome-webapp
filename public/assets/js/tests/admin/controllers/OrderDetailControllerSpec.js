"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/admin/controllers"], function(angular) {

	describe("OrderDetailController", function() {
		var scope;

		beforeEach(module("qfAdminControllers"));

		beforeEach(function() {
			
		});

		beforeEach(function() {
			var params = {};

			return injectController("OrderDetailController", "views/admin/partials/orders/detail.html", params, function($scope) {
				scope = $scope;
			})
		});

		it("should have a order property", function() {
			expect(scope.order).toBeDefined();
		});

		describe("on startup", function() {
			it("should listen an order from $dialogParameters", function() {
				var order = {id: -1};
				scope.$broadcast("$dialogParameters", {order: order});

				expect(scope.order).toEqual(order);
			});
		});
	});
});