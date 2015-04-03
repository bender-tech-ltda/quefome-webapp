"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("AddressService", function() {
		var $httpBackend, AddressService;

		var validAddress = {
			zipCode: "90570020",
			address: "Rua Tobias da Silva",
			neighborhood: "Moinhos de Vento",
			city: {
				name: "Porto Alegre",
				ibgeCode: "4314902",
				state: {acronym: "RS"}
			}
		};

		var invalidAddres = {
			zipCode: "93336220",
			address: "Rua Marechal Câmara",
			neighborhood: "Ideal",
			city: {
				name: "Novo Hamburgo",
				ibgeCode: "4314909",
				state: {acronym: "RS"}
			}
		};

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_AddressService_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			AddressService = _AddressService_;
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		describe("the searchZipCode function", function() {
			it("should return an address for zip code", function() {
				$httpBackend.expectGET("/api/addresses/search/zip-code/90570020").respond(200, validAddress);

				AddressService.searchZipCode("90570020").then(function(address) {
					expect(address).toEqual(validAddress);
				}, function() {
					expect(false).toBe(true);
				});

				$httpBackend.flush();
			});

			it("should get strip off all non-number characteres from the zip code", function() {
				$httpBackend.expectGET("/api/addresses/search/zip-code/90570020").respond(200, validAddress);

				AddressService.searchZipCode("90570-020");
				$httpBackend.flush();
			});
		});

		describe("the getCurrentAddress and setCurrentAddress function", function() {
			it("should return null if has no address", function() {
				expect(AddressService.getCurrentAddress()).toBeNull();
			});

			it("should return the address if it is setted", function() {
				var address = {address: "Rua dos Alfeneiros"};

				AddressService.setCurrentAddress(address);
				expect(AddressService.getCurrentAddress()).toEqual(address);
			});
		});
	});
});