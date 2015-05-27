"use strict";

define(["angular", "angular/mock", "quefome/mock", "quefome/admin/controllers"], function(angular) {

	describe("OrderSearchController", function() {
		var scope;
		var MockedDialog;
		var MockedOrderService;

		beforeEach(module("qfAdminControllers"));

		beforeEach(function() {
			MockedDialog = {
				_createCalled: false,
				_createParams: null,
				create: function(params) {
					this._createCalled = true;
					this._createParams = params;
				}
			};

			MockedOrderService = {
				_listCalled: false,
				_listOrders: [],
				list: function() {
					this._listCalled = true;

					var orders = this._listOrders;
					return {
						then: function(success, fail) {
							if (orders) {
								success(orders);
							} else {
								fail();
							}
						}
					};
				}
			};			
		});

		beforeEach(function() {
			var params = {
				Dialog: MockedDialog,
				OrderService: MockedOrderService
			};

			return injectController("OrderSearchController", "views/admin/partials/orders/search.html", params, function($scope) {
				scope = $scope;
			})
		});

		it("should have a orders property", function() {
			expect(scope.orders).toBeDefined();
		});

		it("should have a searchingOrders property", function() {
			expect(scope.searchingOrders).toBeDefined();
		});

		it("should have a searchingOrders property", function() {
			expect(scope.searchError).toBeDefined();
		});

		describe("on startup", function() {
			it("should search orders", function() {
				MockedOrderService._listCalled = false;
				scope.startup();

				expect(MockedOrderService._listCalled).toBe(true);
			});
		});

		describe("when searching orders", function() {
			it("should call the OrderService", function() {
				MockedOrderService._listCalled = false;
				scope.orders = null;

				MockedOrderService._listOrders = [{id: -2}];

				scope.searchOrders();

				expect(MockedOrderService._listCalled).toBe(true);
				expect(scope.orders).toEqual(MockedOrderService._listOrders);
			});

			it("should set the searchingOrders to true and the searchError to false", function() {
				MockedOrderService.list = function() {
					return {then: function() {}};
				};

				scope.searchOrders();
				expect(scope.searchingOrders).toBe(true);
				expect(scope.searchError).toBe(false);
			});

			it("should set the searchingOrders to false after finish", function() {
				scope.searchOrders();
				expect(scope.searchingOrders).toBe(false);

				MockedOrderService._listOrders = false;
				scope.searchOrders();
				expect(scope.searchingOrders).toBe(false);
			});

			it("should set searchError to true on error", function() {
				MockedOrderService._listOrders = false;
				scope.searchOrders();
				expect(scope.searchError).toBe(true);
			});
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

				expect(MockedDialog._createParams.params.order).toEqual(order);
			});

			it("should ask to the dialog hide the action buttons", function() {
				scope.showOrderDetails({id: -1});

				expect(MockedDialog._createParams.params.hideActions).toBe(true);
			});
		});
	});
});