"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("OrderService", function() {
		var $httpBackend, OrderService;
		var MockedPrintService;

		beforeEach(module("qfAdminServices"));

		beforeEach(function() {
			MockedPrintService = {
				_printCalled: false,
				_printOptions: null,
				print: function(options) {
					this._printCalled = true;
					this._printOptions = options;
				}
			};

			module(function($provide) {
				$provide.value("PrintService", MockedPrintService);
			});
		});

		beforeEach(inject(function(_OrderService_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			OrderService = _OrderService_;
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		it("should return the list of orders of the current logged esblishment", function() {
			var orderList = [{date: new Date(), status: "OPEN"}];
			$httpBackend.whenGET("/api/establishment/orders/").respond(200, orderList);

			OrderService.list().then(function(orders) {
				expect(orders).toEqual(orderList);
			});

			$httpBackend.flush();
		});

		it("should accept a filter param in the list function", function() {
			var today = new Date();
			var query = "fromDate=" + today.getTime() + "&status=OPEN&toDate=" + today.getTime();

			$httpBackend.whenGET("/api/establishment/orders/?" + query).respond(200, []);
			OrderService.list({status: "OPEN", fromDate: today, toDate: today});

			$httpBackend.flush();
		});

		it("should change the order status", function() {
			var order = {id: -42, status: 'OPEN', date: new Date()};

			var statusChangedOrder = angular.copy(order);
			statusChangedOrder.status = 'PRODUCTION';

			$httpBackend.whenPUT("/api/orders/" + order.id + "/status/").respond(200, statusChangedOrder);

			var updatedOrder = null;
			OrderService.changeStatus(order).then(function(_updatedOrder) {
				updatedOrder = _updatedOrder;
			});

			$httpBackend.flush();

			expect(updatedOrder.id).toEqual(order.id);
			expect(updatedOrder.status).toEqual("PRODUCTION");
		});

		describe("print()", function() {
			it("should call the PrintService", function() {
				var order = {id: 1};

				MockedPrintService._printCalled = false;
				MockedPrintService._printOptions = null;
				
				OrderService.print(order);

				expect(MockedPrintService._printCalled).toBe(true);

				expect(MockedPrintService._printOptions.url).toEqual("/admin/orders/1/print/");
				expect(MockedPrintService._printOptions.method).toEqual("post");
				expect(MockedPrintService._printOptions.data).toEqual(order);
			});
		})
	});
});