"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("order status description filter", function() {
		var phoneFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			phoneFilter = $filter("phone");
		}));

		it("should separate digit number if the number has 8 digits", function() {
			var result = phoneFilter("00000000")
			expect(result).toEqual("0000-0000");
		});

		it("should separate digit number if the number has 9 digits", function() {
			var result = phoneFilter("000000000")
			expect(result).toEqual("0000-00000");
		});

		it("should separate the area code if present", function() {
			var result = phoneFilter("0000000000")
			expect(result).toEqual("(00) 0000-0000");

			result = phoneFilter("00000000000")
			expect(result).toEqual("(00) 0000-00000");
		});

		it("should ignore if the number has more than 11 digits", function() {
			var result = phoneFilter("000000000000")
			expect(result).toEqual("000000000000");

			result = phoneFilter("+000000000000")
			expect(result).toEqual("+000000000000");
		});

		it("should parse as local number if it is a brazillian number", function() {
			var result = phoneFilter("550000000000")
			expect(result).toEqual("(00) 0000-0000");

			result = phoneFilter("+550000000000")
			expect(result).toEqual("(00) 0000-0000");

			result = phoneFilter("5500000000000")
			expect(result).toEqual("(00) 0000-00000");

			result = phoneFilter("+5500000000000")
			expect(result).toEqual("(00) 0000-00000");
		});
	});
});