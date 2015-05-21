"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("order status description filter", function() {
		var phoneFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			phoneFilter = $filter("phone");
		}));

		it("should separate digit number if the number has 8 digits", function() {
			var result = phoneFilter("35934949")
			expect(result).toEqual("3593-4949");
		});

		it("should separate digit number if the number has 9 digits", function() {
			var result = phoneFilter("359349499")
			expect(result).toEqual("3593-49499");
		});

		it("should separate the area code if present", function() {
			var result = phoneFilter("5135934949")
			expect(result).toEqual("(51) 3593-4949");

			result = phoneFilter("51359349499")
			expect(result).toEqual("(51) 3593-49499");
		});

		it("should ignore if the number has more than 11 digits", function() {
			var result = phoneFilter("019146822009")
			expect(result).toEqual("019146822009");

			result = phoneFilter("+019146822009")
			expect(result).toEqual("+019146822009");
		});

		it("should parse as local number if it is a brazillian number", function() {
			var result = phoneFilter("555135934949")
			expect(result).toEqual("(51) 3593-4949");

			result = phoneFilter("+555135934949")
			expect(result).toEqual("(51) 3593-4949");

			result = phoneFilter("5551359349499")
			expect(result).toEqual("(51) 3593-49499");

			result = phoneFilter("+5551359349499")
			expect(result).toEqual("(51) 3593-49499");
		});
	});
});