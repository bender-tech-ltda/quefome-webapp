"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("pretty time filter", function() {
		var prettyTimeFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			prettyTimeFilter = $filter("prettyTime");
		}));

		it("should use the HH:mm format if the date is equal today", function() {
			var date = new Date();
			date.setHours(2, 0);

			var result = prettyTimeFilter(date);
			expect(result).toEqual("02:00");

			date.setHours(15, 0);

			result = prettyTimeFilter(date);
			expect(result).toEqual("15:00");
		});


		it("should specify the date if different from today", function() {
			var today = new Date();
			today.setMonth(3, 14);

			var date = new Date();
			date.setMonth(3, 15);
			date.setHours(14, 17);

			var result = prettyTimeFilter(date);
			expect(result).toEqual("14:17 do dia 15/04");
		});
	});
});