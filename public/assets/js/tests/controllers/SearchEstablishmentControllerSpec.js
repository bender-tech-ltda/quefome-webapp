"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("SearchEstablishmentController", function() {
		var scope, controller, MockedProductTypeService, MockedEstablishmentService, Mocked$location;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			MockedProductTypeService = {
				called: false,

				_list: [
					{name: "Pizza"},
					{name: "Hamburguer"}
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

			MockedEstablishmentService = {
				called: false,
				query: false,

				_list: [
					{name: "Xis 666"},
					{name: "Panqueca da hora!"}
				],

				list: function(query) {
					this.called = true;
					this.query = query;

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
			var params = {
				ProductTypeService: MockedProductTypeService,
				EstablishmentService: MockedEstablishmentService,
				$location: Mocked$location
			};

			return injectController("SearchEstablishmentController", "views/partials/establishments/search.html", params, function($scope) {
				scope = $scope;
			});
		});

		it("should have a productTypes property", function() {
			expect(scope.productTypes).toBeDefined();
		});

		it("should have a establishments property", function() {
			expect(scope.establishments).toBeDefined();
		});

		it("should have a selectedProductType property", function() {
			expect(scope.selectedProductType).toBeDefined();
		});

		it("should get the list of productTypes from service on startup", function() {
			expect(MockedProductTypeService.called).toBe(true);
			expect(scope.productTypes).toEqual(MockedProductTypeService._list);
		});

		it("should search for a list of establishments on startup", function() {
			expect(MockedEstablishmentService.called).toBe(true);
			expect(scope.establishments).toEqual(MockedEstablishmentService._list);
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

			it("should search for establishments", function() {
				var productType = {
					name: "Teste"
				};

				expect(function() {
					scope.selectProductType(productType);
				}).not.toThrow();

				expect(scope.establishments).toEqual(MockedEstablishmentService._list);
			});
		});

		it("should search for a list of establishments", function() {
			expect(function() {
				scope.searchEstablishments();
			}).not.toThrow();

			expect(scope.establishments).toEqual(MockedEstablishmentService._list);
		});

		it("should search for a list of establishments using a query object", function() {
			var productType = {name: "Teste"};
			scope.selectProductType(productType);

			expect(function() {
				scope.searchEstablishments();
			}).not.toThrow();

			expect(MockedEstablishmentService.query).toEqual(productType);
		});
	});
});