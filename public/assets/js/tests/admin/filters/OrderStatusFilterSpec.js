"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("order status filter", function() {
		var orderStatusFilter;

		beforeEach(module("qfAdminFilters"));

		beforeEach(inject(function($filter) {
			orderStatusFilter = $filter("orderStatus");
		}));

		it("should return 'Aberto' when the order is open", function() {
			var result = orderStatusFilter("OPEN")
			expect(result).toEqual("Aberto");
		});

		it("should return 'Em Produção' when the order is in production", function() {
			var result = orderStatusFilter("PRODUCTION")
			expect(result).toEqual("Em Produção");
		});

		it("should return 'Entregue' when the order delivered", function() {
			var result = orderStatusFilter("DELIVERED")
			expect(result).toEqual("Entregue");
		});

		it("should accept an order object", function() {
			var order = {
				status: "OPEN"
			};

			var result = orderStatusFilter(order)
			expect(result).toEqual("Aberto");
		});
	});
});