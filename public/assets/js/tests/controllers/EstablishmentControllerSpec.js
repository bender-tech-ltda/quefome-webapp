"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("EstablishmentController", function() {
		var scope, controller;
		var Mocked$routeParams;
		var MockedDialog;
		var MockedEstablishmentService, MockedAddressService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			Mocked$routeParams = {
				establishmentUrl: "url-restaurante"
			};

			MockedDialog = {
				_called: false,
				_params: null,
				create: function(params) {
					this._called = true;
					this._params = params;
				}
			};

			MockedEstablishmentService = {
				findCalled: false,
				lastFindUrl: null,
				urlEstablishment: {id: -42, name: "Teste"},
				findByUrl: function(url) {
					this.findCalled = true;
					this.lastFindUrl = url;

					var establishment = this.urlEstablishment;

					return {
						then: function(callback) {
							callback(establishment);
						}
					};
				},

				productsCalled: false,
				lastEstablishment: null,
				_products: [{id: -42, name: "Pastel"}],
				products: function(establishment) {
					this.productsCalled = true;
					this.lastEstablishment = establishment;

					var products = this._products;

					return {
						then: function(callback) {
							callback(products);
						}
					};
				}
			};

			MockedAddressService = {
				_called: false,
				_currentAddress: null,
				getCurrentAddress: function() {
					this._called = true;
					return this._currentAddress;
				}
			};
		});

		beforeEach(function() {
			var params = {
				$routeParams: Mocked$routeParams,
				Dialog: MockedDialog,
				EstablishmentService: MockedEstablishmentService,
				AddressService: MockedAddressService
			};

			return injectController("EstablishmentController", "views/partials/establishments/establishment.html", params, function($scope) {
				scope = $scope;
			});
		});

		it("should have a establishment property", function() {
			expect(scope.establishment).toBeDefined();
		});

		describe("on startup", function() {
			it("should search for a establishment", function() {
				expect(MockedEstablishmentService.findCalled).toBe(true);
				expect(scope.establishment).toEqual(MockedEstablishmentService.urlEstablishment);
			});

			it("should search for a establishment using the $routeParams.establishmentUrl property", function() {
				expect(MockedEstablishmentService.lastFindUrl).toEqual(Mocked$routeParams.establishmentUrl);
			});

			it("should search for the establishment products", function() {
				expect(MockedEstablishmentService.productsCalled).toBe(true);
				expect(scope.products).toEqual(MockedEstablishmentService._products);
			});

			it("should search for the establishment products using the current establishment", function() {
				expect(MockedEstablishmentService.lastEstablishment).toBe(MockedEstablishmentService.urlEstablishment);
			});
		});

		describe("when checking for user address", function() {
			it("should check if the user already informed its address", function() {
				scope.checkUserAddress({preventDefault: function() {}}, {});
				expect(MockedAddressService._called).toBe(true);
			});

			it("should show a dialog if the user did not informed its address yet", function() {
				MockedAddressService._currentAddress = false;
				scope.checkUserAddress({preventDefault: function() {}}, {});

				expect(MockedDialog._called).toBe(true);
			});

			it("should not show a dialog if the user skipped the address check", function() {
				MockedAddressService._currentAddress = {skipped: true};
				scope.checkUserAddress({preventDefault: function() {}}, {});

				expect(MockedDialog._called).toBe(false);
			});
		});
	});
});