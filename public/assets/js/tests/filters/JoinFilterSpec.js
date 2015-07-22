"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("join filter", function() {
		var joinFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			joinFilter = $filter("join");
		}));

		it("should join an array with a separator", function() {
			var result = joinFilter(["1", 2, "3"], ",");
			expect(result).toEqual("1,2,3");
		});

		it("should join an object array with a separator and a property", function() {
			var result = joinFilter([{value: 1}, {value: 2}, {value: "3"}], ",", "value");
			expect(result).toEqual("1,2,3");
		});

		it("should join an object array with a separator and a function", function() {
			var result = joinFilter([{value: 1}, {value: 2}, {value: "3"}], ",", function(option) {
				return "(" + option.value + ")"
			});
			expect(result).toEqual("(1),(2),(3)");
		});		

		it("should join an array with a default separtor", function() {
			var result = joinFilter(["1", 2, 3]);
			expect(result).toEqual("1, 2, 3");
		});
	});
});