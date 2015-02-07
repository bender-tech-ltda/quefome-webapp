"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("SearchEstablishmentController", function() {
		var scope, controller, MockedProductTypeService, Mocked$location;

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

			Mocked$location = {
				_currentQuery: {},

				search: function(propertyOrObject, value) {
					if (propertyOrObject) {
						if (typeof(propertyOrObject) === "object") {
							this._currentQuery = propertyOrObject;
						} else if (typeof(propertyOrObject) === "string") {
							if (typeof(value) !== "undefined") {
								this._currentQuery[propertyOrObject] = value;
							}

							return this._currentQuery[propertyOrObject];
						}
					}

					return this._currentQuery;
				}
			};
		});

		beforeEach(function() {
			return injectController("SearchDeliveryController", "views/partials/establishments/search.html", {ProductTypeService: MockedProductTypeService, $location: Mocked$location}, function($scope) {
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

		it("should have a selectedProductType property", function() {
			expect(scope.selectedProductType).toBeDefined();
		});

		describe("selecting a product type", function() {
			it("should set the selectedProductType", function() {
				var productType = {
					name: "Teste"
				};

				expect(function() {
					scope.selectProductType(productType);
				}).not.toThrow();

				expect(scope.selectedProductType).toEqual(productType);
			});

			it("should change the current query search in the URL", function() {
				var productType = {
					name: "Teste"
				};

				expect(function() {
					scope.selectProductType(productType);
				}).not.toThrow();

				expect(Mocked$location.search("productType")).toEqual(productType.name);
			});
		});
	});
});