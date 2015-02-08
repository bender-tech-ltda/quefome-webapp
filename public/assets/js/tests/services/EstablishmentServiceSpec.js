"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("EstablishmentService", function() {
		var $httpBackend, EstablishmentService;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_EstablishmentService_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			EstablishmentService = _EstablishmentService_;
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		describe("the list function", function() {
			it("should return a list of establishments", function() {
				var establishmentsResponse = [{name: "Xis-men"}];
				$httpBackend.expectGET("/api/establishments/").respond(200, establishmentsResponse);

				EstablishmentService.list().then(function(establishments) {
					expect(establishments).toEqual(establishmentsResponse);
				});

				$httpBackend.flush();
			});

			it("should accept a query object", function() {
				var query = {productType: "Teste"};

				$httpBackend.expectGET("/api/establishments/?productType=Teste").respond(200, []);

				EstablishmentService.list(query);
				$httpBackend.flush();
			});
		});
	});
});