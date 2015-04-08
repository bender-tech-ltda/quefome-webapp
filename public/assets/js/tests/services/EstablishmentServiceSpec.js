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

			it("should accept a query object with a productType property", function() {
				var query = {productType: "Teste"};

				$httpBackend.expectGET("/api/establishments/?productType=Teste").respond(200, []);

				EstablishmentService.list(query);
				$httpBackend.flush();
			});

			it("should accept a query object with a q property", function() {
				var query = {query: "Teste"};

				$httpBackend.expectGET("/api/establishments/?q=Teste").respond(200, []);

				EstablishmentService.list(query);
				$httpBackend.flush();
			});
		});

		describe("the names function", function() {
			it("should search for a list of names", function() {
				var response = ["Xis", "Pizzaria", "Blablabla"];
				$httpBackend.expectGET("/api/establishments/names/").respond(200, response);

				EstablishmentService.names().then(function(names) {
					expect(names).toEqual(response);
				});

				$httpBackend.flush();
			});

			it("should search using a query", function() {
				var query = "xis";

				var response = ["Xis"];
				$httpBackend.expectGET("/api/establishments/names/?q=" + query).respond(200, response);

				EstablishmentService.names(query);
				$httpBackend.flush();
			});
		});

		describe("the findByUrl function", function() {
			it("should find a establishment with a url", function() {
				var url = "teste";
				var response = {id: -42, name: "Teste"};

				$httpBackend.expectGET("/api/establishments/" + url).respond(200, response);

				EstablishmentService.findByUrl(url);
				$httpBackend.flush();
			});
		});

		describe("the isAttendingAddress function", function() {
			it("should check if a address is attended by an establishment", function() {
				var establishment = {id: 2};
				
				var address = {
					zipCode: "93336220",
					address: "Rua A",
					neighborhood: "Centro",
					city: {
						name: "Porto Alegre",
						state: {acronym: "RS"}
					}
				};

				$httpBackend.expectGET("/api/establishments/2/attend-address/93336220/Rua A/Centro/Porto Alegre/RS/").respond(200, true);
				EstablishmentService.isAttendingAddress(establishment, address);

				$httpBackend.flush();
			});
		});
	});
});