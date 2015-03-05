"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("InformDeliveryAddressController", function() {
		var scope, controller, MockedNeighborhoodService, MockedAddressService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			var categories = {
				"cartao": {
					name: "Cartão"
				},

				"dinheiro": {
					name: "Dinheiro"
				}
			};

			MockedNeighborhoodService = {
				called: false,

				_list: [
					{
						name: "Ideal"
					},
					{
						name: "Boa vista"
					},
					{
						name: "Hamburgo Velho"
					},
					{
						name: "Moinhos de Vento"
					}
				],

				list: function() {
					this.called = true;
					var list = this._list;

					return {
						then: function(callback) {
							callback(list);
						}
					};
				}
			};

			MockedAddressService = {
				_zipCodes: {
					"90570020": {
						zipCode: "90570020",
						address: "Rua Tobias da Silva",
						neighborhood: "Moinhos de Vento",
						city: {
							name: "Porto Alegre",
							ibgeCode: "4314902",
							state: {acronym: "RS"}
						},
					},
				},

				searchZipCode: function(zipCode) {
					var that = this;

					return {
						then: function(successCalback, errorCallback) {
							if (that._zipCodes[zipCode]) {
								successCalback(that._zipCodes[zipCode]);
							} else {
								errorCallback("CEP não encontrado");
							}
						}
					};
				}
			};
		});

		beforeEach(function() {
			var params = {
				NeighborhoodService: MockedNeighborhoodService,
				AddressService: MockedAddressService
			};

			return injectController("InformDeliveryAddressController", "views/partials/establishments/inform-delivery-address.html", params, function($scope) {
				scope = $scope;
			});
		});

		it("should have a neighborhoods property", function() {
			expect(scope.neighborhoods).toBeDefined();
		});

		it("should have a order property", function() {
			expect(scope.order).toBeDefined();
		});

		it("should get a list of neighborhoods on startup", function() {
			expect(MockedNeighborhoodService.called).toBe(true);
			expect(scope.neighborhoods).toEqual(MockedNeighborhoodService._list);
		});

		it("should get a set the complete the address when the zip code is informed", function() {
			scope.order.address.zipCode = "90570020";
			scope.completeAddressUsingZipCode();

			var address = MockedAddressService._zipCodes["90570020"];

			expect(scope.order.address.address).toEqual(address.address);
			expect(scope.order.address.neighborhood.name).toEqual(address.neighborhood);
		});
	});
});