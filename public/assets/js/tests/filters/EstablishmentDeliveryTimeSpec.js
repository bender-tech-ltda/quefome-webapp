"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("establishmentDeliveryTime filter", function() {
		var establishmentDeliveryTimeFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			establishmentDeliveryTimeFilter = $filter("establishmentDeliveryTime");
		}));

		var establishment;

		beforeEach(function() {
			establishment = {};
			establishment.parameters = {};
		});

		it("should use the minimum time when the maximum time is not present", function() {
			establishment.parameters.minimumDeliveryTime = 10;

			var result = establishmentDeliveryTimeFilter(establishment);
			expect(result).toEqual(establishment.parameters.minimumDeliveryTime + "min.");
		});

		it("should use the maximum time when the minimum time is not present", function() {
			establishment.parameters.maximumDeliveryTime = 20;

			var result = establishmentDeliveryTimeFilter(establishment);
			expect(result).toEqual(establishment.parameters.maximumDeliveryTime + "min.");
		});

		it("should return 0 when minimum and maximum time is not present", function() {
			var result = establishmentDeliveryTimeFilter(establishment);
			expect(result).toEqual("0min.");
		});

		it("should return on time if the minimum and maximum time are equal", function() {
			establishment.parameters.minimumDeliveryTime = 30;
			establishment.parameters.maximumDeliveryTime = 30;

			var result = establishmentDeliveryTimeFilter(establishment);
			expect(result).toEqual(establishment.parameters.minimumDeliveryTime + "min.");
		});

		it("should return minimum and maximum time if they are different", function() {
			establishment.parameters.minimumDeliveryTime = 30;
			establishment.parameters.maximumDeliveryTime = 70;

			var result = establishmentDeliveryTimeFilter(establishment);
			expect(result).toEqual(establishment.parameters.minimumDeliveryTime + " à " + establishment.parameters.maximumDeliveryTime + "min.");
		});
	});
});