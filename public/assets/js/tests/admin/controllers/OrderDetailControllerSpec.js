"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/admin/controllers"], function(angular) {

	describe("OrderDetailController", function() {
		var scope;
		var MockedOrderService;

		beforeEach(module("qfAdminControllers"));

		beforeEach(function() {
			MockedOrderService = {
				_updateOrder: false,
				update: function(order) {
					this._updateOrder = order;

					return {
						then: function(success) {
							success(order);
						}
					};
				}
			};			
		});

		beforeEach(function() {
			var params = {
				OrderService: MockedOrderService
			};

			return injectController("OrderDetailController", "views/admin/partials/orders/detail.html", params, function($scope) {
				scope = $scope;
			})
		});

		it("should have a order property", function() {
			expect(scope.order).toBeDefined();
		});

		it("should have a changingOrderStatus property", function() {
			expect(scope.changingOrderStatus).toBeDefined();
		});

		it("should have a errorChangingStatus property", function() {
			expect(scope.errorChangingStatus).toBeDefined();
		});

		describe("on startup", function() {
			it("should listen an order from $dialogParameters", function() {
				var order = {id: -1};
				scope.$broadcast("$dialogParameters", {order: order});

				expect(scope.order).toEqual(order);
			});
		});

		describe("when changing the order status", function() {
			it("should set the order.status to the status passed as parameter", function() {
				scope.order = {id: -5};
				scope.changeOrderStatus('PRODUCTION');

				expect(MockedOrderService._updateOrder.id).toEqual(scope.order.id);
				expect(MockedOrderService._updateOrder.status).toEqual('PRODUCTION');
			});

			it("should set the changingOrderStatus to true and errorChangingStatus to false", function() {
				scope.errorChangingStatus = true;

				MockedOrderService.update = function() {
					return {then: function() {}};
				};

				scope.order = {id: -5};
				scope.changeOrderStatus();

				expect(scope.changingOrderStatus).toBe(true);
				expect(scope.errorChangingStatus).toBe(false);
			});

			it("should set the changingOrderStatus to false after finish", function() {
				scope.order = {id: -5};

				scope.changeOrderStatus();
				expect(scope.changingOrderStatus).toBe(false);

				MockedOrderService.update = function() {
					return {then: function(success, error) {
						error();
					}};
				};

				scope.changeOrderStatus();
				expect(scope.changingOrderStatus).toBe(false);
			});

			it("should set the errorChangingStatus to true if it fails", function() {
				MockedOrderService.update = function() {
					return {then: function(success, error) {
						error();
					}};
				};

				scope.order = {id: -5};

				scope.changeOrderStatus();
				expect(scope.errorChangingStatus).toBe(true);
			});
		});

		describe("when marking an order as open", function() {
			it("should call the change order status passing the status as parameter", function() {
				var status = null;
				scope.changeOrderStatus = function(_status) {
					status = _status;
				};

				scope.markAsOpen();
				expect(status).toEqual('OPEN');
			});
		});

		describe("when sending an order to production", function() {
			it("should call the change order status passing the status as parameter", function() {
				var status = null;
				scope.changeOrderStatus = function(_status) {
					status = _status;
				};

				scope.sendOrderToProduction();
				expect(status).toEqual('PRODUCTION');
			});
		});

		describe("when marking an order as delivered", function() {
			it("should call the change order status passing the status as parameter", function() {
				var status = null;
				scope.changeOrderStatus = function(_status) {
					status = _status;
				};

				scope.markAsDelivered();
				expect(status).toEqual('DELIVERED');
			});
		});
	});
});