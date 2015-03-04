"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("NeighborhoodService", function() {
		var $httpBackend, NeighborhoodService;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_NeighborhoodService_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			NeighborhoodService = _NeighborhoodService_;
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		describe("the list function", function() {
			it("should return a list of neighborhoods", function() {
				var neighborhoodsResponse = [{name: "Ideal"}];
				$httpBackend.expectGET("/api/neighborhoods/").respond(200, neighborhoodsResponse);

				NeighborhoodService.list().then(function(neighborhoods) {
					expect(neighborhoods).toEqual(neighborhoodsResponse);
				});

				$httpBackend.flush();
			});
		});
	});
});