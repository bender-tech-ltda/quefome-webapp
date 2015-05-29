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
				_listFilter: null,
				_listOrders: [],
				list: function(filter) {
					this._listCalled = true;
					this._listFilter = filter;

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

		it("should have a filter property", function() {
			expect(scope.filter).toBeDefined();
		});

		describe("on startup", function() {
			it("should set the default filters", function() {
				scope.filter.status = false;
				scope.filter.fromDate = null;
				scope.filter.toDate = null;

				scope.startup();

				expect(scope.filter.status).toEqual("");
				expect(scope.filter.fromDate instanceof Date).toBe(true);
				expect(scope.filter.toDate instanceof Date).toBe(true);
			});

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

			it("should pass the filter as parameter to the service", function() {
				MockedOrderService._listFilter = null;
				scope.searchOrders();

				expect(MockedOrderService._listFilter).toEqual(scope.filter);
			});

			it("should validate the filter", function() {
				var called = false;

				scope.isFilterInvalid = function() {
					called = true;
					return true;
				};

				scope.searchOrders();
				expect(called).toBe(true);
			});
		});

		describe("when showing order details", function() {
			it("should show a dialog", function() {
				MockedDialog._createCalled = false;
				scope.showOrderDetails({});
				expect(MockedDialog._createCalled).toBe(true);
				expect(MockedDialog._createParams.show).toBe(true);
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

		describe("when validating the filter", function() {
			beforeEach(function() {
				scope.filter = {
					status: "",
					fromDate: new Date(),
					toDate: new Date()
				};
			});

			it("should validate if the filter.fromDate is a date", function() {
				scope.filter.fromDate = null;
				var result = scope.isFilterInvalid();
				expect(result).toBe(true);

				scope.filter.fromDate = "2015-10-27";
				result = scope.isFilterInvalid();
				expect(result).toBe(true);

				scope.filter.fromDate = {};
				result = scope.isFilterInvalid();
				expect(result).toBe(true);

				scope.filter.fromDate = new Date();
				result = scope.isFilterInvalid();
				expect(result).toBe(false);
			});

			it("should validate if the filter.toDate is a date", function() {
				scope.filter.toDate = null;
				var result = scope.isFilterInvalid();
				expect(result).toBe(true);

				scope.filter.toDate = "2015-10-27";
				result = scope.isFilterInvalid();
				expect(result).toBe(true);

				scope.filter.toDate = {};
				result = scope.isFilterInvalid();
				expect(result).toBe(true);

				scope.filter.toDate = new Date();
				result = scope.isFilterInvalid();
				expect(result).toBe(false);
			});

			it("should validate if the filter.fromDate is higher than the filter.toDate", function() {
				scope.filter.fromDate = new Date();
				scope.filter.fromDate.setDate(20);

				scope.filter.toDate = new Date();
				scope.filter.toDate.setDate(19);

				var result = scope.isFilterInvalid();
				expect(result).toBe(true);
			});

			it("should ignore the hours when validate if the filter.fromDate is higher than the filter.toDate", function() {
				scope.filter.fromDate = new Date();
				scope.filter.fromDate.setDate(20);
				scope.filter.fromDate.setHours(20, 17);

				scope.filter.toDate = new Date();
				scope.filter.toDate.setDate(20);
				scope.filter.toDate.setHours(15, 38);

				var result = scope.isFilterInvalid();
				expect(result).toBe(false);
			});
		});

		describe("when getting the invalid filter message", function() {
			beforeEach(function() {
				scope.filter = {
					status: "",
					fromDate: new Date(),
					toDate: new Date()
				};

				scope.$digest();
			});

			it("should return a message if the filterForm.fromDate is blank", function() {
				scope.filterForm.fromDate.$error.required = true;
				var result = scope.getInvalidFilterMessage();
				expect(result.length).toBeGreaterThan(0);

				scope.filterForm.fromDate.$error.required = false;
				result = scope.getInvalidFilterMessage();
				expect(result.length).toEqual(0);
			});

			it("should return a message if the filterForm.fromDate is a date", function() {
				scope.filterForm.fromDate.$error.date = true;
				var result = scope.getInvalidFilterMessage();
				expect(result.length).toBeGreaterThan(0);

				scope.filterForm.fromDate.$error.date = false;
				result = scope.getInvalidFilterMessage();
				expect(result.length).toEqual(0);
			});

			it("should return a message if the filterForm.toDate is blank", function() {
				scope.filterForm.toDate.$error.required = true;
				var result = scope.getInvalidFilterMessage();
				expect(result.length).toBeGreaterThan(0);

				scope.filterForm.toDate.$error.required = false;
				result = scope.getInvalidFilterMessage();
				expect(result.length).toEqual(0);
			});

			it("should return a message if the filterForm.toDate is a date", function() {
				scope.filterForm.toDate.$error.date = true;
				var result = scope.getInvalidFilterMessage();
				expect(result.length).toBeGreaterThan(0);

				scope.filterForm.toDate.$error.date = false;
				result = scope.getInvalidFilterMessage();
				expect(result.length).toEqual(0);
			});

			it("should return a message if the filter.fromDate is higher than the filter.toDate", function() {
				scope.filter.fromDate = new Date();
				scope.filter.fromDate.setDate(20);

				scope.filter.toDate = new Date();
				scope.filter.toDate.setDate(19);

				var result = scope.isFilterInvalid();
				result = scope.getInvalidFilterMessage();
				expect(result.length).toBeGreaterThan(0);

				scope.filter.toDate.setDate(21);

				result = scope.getInvalidFilterMessage();
				expect(result.length).toEqual(0);
			});

			it("should ignore the hours when checking if the filter.fromDate is higher than the filter.toDate", function() {
				scope.filter.fromDate = new Date();
				scope.filter.fromDate.setDate(20);
				scope.filter.fromDate.setHours(20, 17);

				scope.filter.toDate = new Date();
				scope.filter.toDate.setDate(20);
				scope.filter.toDate.setHours(15, 38);

				var result = scope.isFilterInvalid();
				result = scope.getInvalidFilterMessage();
				expect(result.length).toEqual(0);
			});
		});
	});
});
