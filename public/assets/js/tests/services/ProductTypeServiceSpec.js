"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("ProductTypeService", function() {
		var $httpBackend, ProductTypeService;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_ProductTypeService_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			ProductTypeService = _ProductTypeService_;
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		it("should return a list of product types", function() {
			var productTypesResponse = [{name: "Teste"}];
			$httpBackend.expectGET("/api/product-types/").respond(200, productTypesResponse);

			ProductTypeService.list().then(function(productTypes) {
				expect(productTypes).toEqual(productTypesResponse);
			});

			$httpBackend.flush();
		});
	});
});