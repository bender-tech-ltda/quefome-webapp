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

				EstablishmentService.names(query).then(function(names) {
					expect(names).toEqual(response);
				});
				$httpBackend.flush();
			});
		});

		describe("the findByUrl function", function() {
			it("should find a establishment with the id", function() {
				var url = "teste";
				var response = {id: -42, name: "Teste"};

				$httpBackend.expectGET("/api/establishments/-42").respond(200, response);

				var respondedEstablishment = null;
				EstablishmentService.findById({id: -42}).then(function(establishment) {
					respondedEstablishment = establishment;
				});

				$httpBackend.flush();

				expect(respondedEstablishment).toEqual(response);
			});

			it("should send a 404 if the url is not found", function() {
				$httpBackend.expectGET("/api/establishments/-20").respond(404, {});

				var notFoundError = false;
				EstablishmentService.findById(-20).then(null, function(error) {
					notFoundError = error.isNotFoundError;
				});

				$httpBackend.flush();

				expect(notFoundError).toBe(true);
			});
		});

		describe("the findByUrl function", function() {
			it("should find a establishment with a url", function() {
				var url = "teste";
				var response = {id: -42, name: "Teste"};

				$httpBackend.expectGET("/api/establishments/" + url).respond(200, response);

				EstablishmentService.findByUrl(url).then(function(establishment) {
					expect(establishment).toEqual(response);
				});

				$httpBackend.flush();
			});

			it("should send a 404 if the url is not found", function() {
				var url = "teste-blablabla";

				$httpBackend.expectGET("/api/establishments/" + url).respond(404, {});

				EstablishmentService.findByUrl(url).then(function() {
					expect(null).toBe("should not get in here");
				}, function(error) {
					expect(error.isNotFoundError).toBe(true);
				});

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
				EstablishmentService.isAttendingAddress(establishment, address).then(function(isAttendingAddress) {
					expect(isAttendingAddress).toBe(true);
				});

				$httpBackend.flush();
			});
		});

		describe("the products function", function() {
			it("should search for products", function() {
				var establishment = {id: 2};
				var response = [{id: 1, name: "Teste"}];

				$httpBackend.expectGET("/api/establishments/2/products/").respond(200, response);
				EstablishmentService.products(establishment).then(function(products) {
					expect(products).toEqual(response);
				});

				$httpBackend.flush();
			});
		});
	});
});