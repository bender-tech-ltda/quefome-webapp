"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("InformDeliveryAddressController", function() {
		var scope, controller, MockedNeighborhoodService;

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
		});

		beforeEach(function() {
			var params = {
				NeighborhoodService: MockedNeighborhoodService
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
	});
});