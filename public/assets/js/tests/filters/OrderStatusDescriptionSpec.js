"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("order status description filter", function() {
		var orderStatusDescriptionFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			orderStatusDescriptionFilter = $filter("orderStatusDescription");
		}));

		it("should return a pretty message when the order is open", function() {
			var result = orderStatusDescriptionFilter("OPEN")
			expect(result).toEqual("O estabelecimento já recebeu seu pedido!");
		});

		it("should return a pretty message when the order is in production", function() {
			var result = orderStatusDescriptionFilter("PRODUCTION")
			expect(result).toEqual("O seu pedido está sendo preparado!");
		});

		it("should return a pretty message when the order delivered", function() {
			var result = orderStatusDescriptionFilter("DELIVERED")
			expect(result).toEqual("O seu pedido já foi entregue!");
		});

		it("should accept an order object", function() {
			var order = {
				status: "OPEN"
			};

			var result = orderStatusDescriptionFilter(order)
			expect(result).toEqual("O estabelecimento já recebeu seu pedido!");
		});
	});
});