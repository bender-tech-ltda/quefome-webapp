"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("money filter", function() {
		var moneyFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			moneyFilter = $filter("money");
		}));

		it("should replace the point by a comma", function() {
			var result = moneyFilter(2.10);
			expect(result).toEqual("2,10");
		});

		it("should ignore the thousand separator", function() {
			var result = moneyFilter(100000);
			expect(result).toEqual("100000,00");
		});

		it("should have two decimal digits", function() {
			var result = moneyFilter(2);
			expect(result).toEqual("2,00");

			result = moneyFilter(10.3);
			expect(result).toEqual("10,30");
		});

		it("should not ignore 0 values", function() {
			var result = moneyFilter(0);
			expect(result).toEqual("0,00");
		});

		it("should consider false values as 0", function() {
			var result = moneyFilter(false);
			expect(result).toEqual("0,00");

			result = moneyFilter(null);
			expect(result).toEqual("0,00");
		});
	});
});