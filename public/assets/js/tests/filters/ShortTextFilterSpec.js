"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("short text filter", function() {
		var shortTextFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			shortTextFilter = $filter("shortText");
		}));

		it("should remove the text after size and add '...'", function() {
			var result = shortTextFilter("testeteste", 5);
			expect(result).toEqual("teste...");
		});

		it("should trim modified text", function() {
			var result = shortTextFilter("teste teste", 6);
			expect(result).toEqual("teste...");
		});

		it("should return the hole text if not higher than size", function() {
			var result = shortTextFilter("testeteste", 10);
			expect(result).toEqual("testeteste");
		});
	});
});