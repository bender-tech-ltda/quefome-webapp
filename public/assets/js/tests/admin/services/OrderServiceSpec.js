"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("OrderService", function() {
		var $httpBackend, OrderService;

		beforeEach(module("qfAdminServices"));

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
	});
});