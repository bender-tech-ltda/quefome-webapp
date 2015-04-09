"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("establishmentStatus filter", function() {
		var establishmentStatusFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			establishmentStatusFilter = $filter("establishmentStatus");
		}));

		var establishment;

		beforeEach(function() {
			establishment = {};
			establishment.parameters = {};
		});

		it("should return 'Aberto' when the establishment status is OPEN", function() {
			establishment.parameters.status = 'OPEN';

			var result = establishmentStatusFilter(establishment);
			expect(result).toEqual('Aberto');
		});

		it("should return 'Fechado' when the establishment status is CLOSED", function() {
			establishment.parameters.status = 'CLOSED';

			var result = establishmentStatusFilter(establishment);
			expect(result).toEqual('Fechado');
		});

		it("return 'Fechado' if the establishment status is null", function() {
			establishment.parameters.status = null;

			var result = establishmentStatusFilter(establishment);
			expect(result).toEqual("Fechado");
		});
	});
});