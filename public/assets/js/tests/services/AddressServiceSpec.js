"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("AddressService", function() {
		var Mocked$localStorage;
		var $httpBackend, AddressService;

		var validAddress = {
			zipCode: "00000003",
			address: "Rua Exemplo 1",
			neighborhood: "Igara",
			city: {
				name: "Canoas",
				ibgeCode: "4304606",
				state: {acronym: "RS"}
			}
		};

		var invalidAddres = {
			zipCode: "00000001",
			address: "Rua Exemplo 2",
			neighborhood: "Ideal",
			city: {
				name: "Novo Hamburgo",
				ibgeCode: "4314909",
				state: {acronym: "RS"}
			}
		};

		beforeEach(module("qfServices"));

		beforeEach(function() {
			Mocked$localStorage = {
				_setKey: null,
				_setValue: null,
				set: function(key, value) {
					this._setKey = key;
					this._setValue = value;
				},

				_getKey: null,
				_getValue: null,
				get: function(key) {
					this._getKey = key;
					return this._getValue;
				}
			};

			module(function($provide) {
				$provide.value("$localStorage", Mocked$localStorage);
			});
		});

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
				$httpBackend.expectGET("/api/addresses/search/zip-code/00000004").respond(200, validAddress);

				AddressService.searchZipCode("00000004").then(function(address) {
					expect(address).toEqual(validAddress);
				}, function() {
					expect(false).toBe(true);
				});

				$httpBackend.flush();
			});

			it("should get strip off all non-number characteres from the zip code", function() {
				$httpBackend.expectGET("/api/addresses/search/zip-code/00000004").respond(200, validAddress);

				AddressService.searchZipCode("90570-020");
				$httpBackend.flush();
			});
		});

		describe("the searchAddress function", function() {
			it("should return an address for an address", function() {
				var searchAddress = {
					address: "Rua 4", 
					city: {
						name: "Canoas",
						state: {acronym: "RS"}
					}
				};

				var addressResponse = angular.copy(searchAddress);
				addressResponse.zipCode = "00000005";

				$httpBackend.expectGET("/api/addresses/search/address/RS/Canoas/Rua 4").respond(200, addressResponse);

				AddressService.searchAddress(searchAddress);
				$httpBackend.flush();
			});
		});

		describe("the getCurrentAddress and setCurrentAddress function", function() {
			it("should be stored into the localStorage", function() {
				var address = {address: "Rua teste tal"};
				AddressService.setCurrentAddress(address);

				expect(Mocked$localStorage._setKey).toEqual("AddressService_currentAddress");
				expect(Mocked$localStorage._setValue).toEqual(address);
			});

			it("should return false if has no address", function() {
				Mocked$localStorage._getValue = null;
				expect(AddressService.getCurrentAddress()).toBe(false);
			});

			it("should return the address if it was one hour ago", function() {
				Mocked$localStorage._getValue = {
					__localStorageObject: true,
					updated: new Date(),
					value: {address: "Rua Exemplo 3"}
				};

				//AddressService.setCurrentAddress(address);
				expect().toEqual(address);
				var address = AddressService.getCurrentAddress();
				expect(address).toEqual(Mocked$localStorage._getValue.value);
			});

			it("should return false the address if it was more than one hour ago", function() {
				Mocked$localStorage._getValue = {
					__localStorageObject: true,
					updated: new Date(),
					value: {address: "Rua Exemplo 3"}
				};

				var today = new Date();
				var hours = (2 * 1000 * 60 * 60); //2 horas
				Mocked$localStorage._getValue.updated.setTime(today.getTime() - hours);

				var address = AddressService.getCurrentAddress();
				expect(address).toBe(false);
			});
		});
	});
});