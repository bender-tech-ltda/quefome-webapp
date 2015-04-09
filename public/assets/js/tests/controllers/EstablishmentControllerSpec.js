"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("EstablishmentController", function() {
		var scope, controller;
		var Mocked$routeParams;
		var MockedEstablishmentService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			Mocked$routeParams = {
				establishmentUrl: "url-restaurante"
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
		});

		beforeEach(function() {
			var params = {
				$routeParams: Mocked$routeParams,
				EstablishmentService: MockedEstablishmentService
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
	});
});