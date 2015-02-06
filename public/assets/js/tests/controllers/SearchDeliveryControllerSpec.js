"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("SearchDeliveryController", function() {
		var scope, controller, MockedProductTypeService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			MockedProductTypeService = {
				called: false,

				_list: [
					{
						name: "Pizza"
					},
					{
						name: "Hamburguer"
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
			return injectController("SearchDeliveryController", "views/partials/deliveries/search.html", {ProductTypeService: MockedProductTypeService}, function($scope) {
				scope = $scope;
			});
		});

		it("should have a productTypes property", function() {
			expect(scope.productTypes).toBeDefined();
		});

		it("should get the list of productTypes from service", function() {
			expect(MockedProductTypeService.called).toBe(true);
			expect(scope.productTypes).toEqual(MockedProductTypeService._list);
		});
	});
});