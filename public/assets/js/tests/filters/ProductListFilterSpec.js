"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("order status description filter", function() {
		var groupProductListFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			groupProductListFilter = $filter("groupProductList");
		}));

		it("should group by id and show the name with quantity", function() {
			var products = [
				{id: -3, name: "Pizza Grande"},
				{id: -3, name: "Pizza Grande"},
				{id: -2, name: "Pizza Pequena"}
			];

			var result = groupProductListFilter(products)
			expect(result).toEqual("Pizza Grande (2), Pizza Pequena (1)");
		});

		it("should accept an order object", function() {
			var order = {
				items: [
					{product: {id: -3, name: "Pizza Grande"}},
					{product: {id: -2, name: "Pizza Pequena"}},
					{product: {id: -2, name: "Pizza Pequena"}}
				]
			};

			var result = groupProductListFilter(order)
			expect(result).toEqual("Pizza Grande (1), Pizza Pequena (2)");
		});

		it("should accept a list of items", function() {
			var items = [
				{product: {id: -3, name: "Pizza Grande"}},
				{product: {id: -2, name: "Pizza Pequena"}},
				{product: {id: -2, name: "Pizza Pequena"}}
			];

			var result = groupProductListFilter(items)
			expect(result).toEqual("Pizza Grande (1), Pizza Pequena (2)");
		});

		it("should sum the items quantity", function() {
			var items = [
				{product: {id: -3, name: "Pizza Grande"}, quantity: 2},
				{product: {id: -2, name: "Pizza Pequena"}, quantity: 3},
				{product: {id: -2, name: "Pizza Pequena"}, quantity: 10}
			];

			var result = groupProductListFilter(items)
			expect(result).toEqual("Pizza Grande (2), Pizza Pequena (13)");
		});

		it("should order by id", function() {
			var items = [
				{product: {id: -3, name: "Pizza Média"}},
				{product: {id: -4, name: "Pizza Grande"}},
				{product: {id: -2, name: "Pizza Pequena"}}
			];

			var result = groupProductListFilter(items)
			expect(result).toEqual("Pizza Grande (1), Pizza Média (1), Pizza Pequena (1)");
		});

		it("should accept a limit filter", function() {
			var items = [
				{product: {id: -3, name: "Pizza Média"}},
				{product: {id: -4, name: "Pizza Grande"}},
				{product: {id: -2, name: "Pizza Pequena"}}
			];

			var result = groupProductListFilter(items, 2)
			expect(result).toEqual("Pizza Grande (1), Pizza Média (1)");
		});
	});
});