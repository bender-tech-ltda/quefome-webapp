"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("SearchEstablishmentController", function() {
		var scope, controller;
		var MockedProductTypeService, MockedEstablishmentService;
		var Mocked$location, Mocked$filter, Mocked$analytics;

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
				},

				_names: ["Xis do Tonhão", "Pizzaria do Mal", "Panqueca do Alemão"],
				names: function(query) {
					this.query = query;

					var names = this._names;

					return {
						then: function(callback) {
							callback(names);
						}
					};
				}
			};

			Mocked$location = {
				_pathPath: "",
				path: function(path) {
					this._pathPath = path;

					return this;
				},

				_searchQuery: {},
				search: function(query) {
					if (query) {
						this._searchQuery = query;
						return this;
					}

					return this._searchQuery;
				},

				_replaceCalled: false,
				replace: function() {
					this._replaceCalled = true;
					return this;
				}
			};

			Mocked$filter = function() {
				return Mocked$filter.parseFunction;
			};

			Mocked$filter.parseFunction = function(value) {
				return value + "";
			};

			Mocked$analytics = {
				_eventTrackCalled: false,
				_eventTrackEvent: null,
				_eventTrackProperties: null,
				eventTrack: function(event, properties) {
					this._eventTrackCalled = true;
					this._eventTrackEvent = event;
					this._eventTrackProperties = properties;
				}
			};
		});

		beforeEach(function() {
			var params = {
				ProductTypeService: MockedProductTypeService,
				EstablishmentService: MockedEstablishmentService,
				$location: Mocked$location,
				$filter: Mocked$filter,
				$analytics: Mocked$analytics
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

		it("should have a searchFilter property", function() {
			expect(scope.searchFilter).toBeDefined();
		});

		it("should have a loadingProductTypes property", function() {
			expect(scope.loadingProductTypes).toBeDefined();
		});

		it("should have a searchingEstablishments property", function() {
			expect(scope.searchingEstablishments).toBeDefined();
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
			it("should set the selected product type", function() {
				var productType = {
					name: "Teste",
					url: "teste"
				};

				expect(function() {
					scope.selectProductType(productType);
				}).not.toThrow();

				expect(scope.isProductTypeSelected(productType)).toBe(true);
			});

			it("should clear the query search", function() {
				scope.searchFilter.query = "teste";

				expect(function() {
					scope.selectProductType({name: "Pudim"});
				}).not.toThrow();

				expect(scope.searchFilter.query).toEqual("");
			});

			it("should change the current query search in the URL", function() {
				var productType = {
					name: "Teste",
					url: "teste"
				};

				expect(function() {
					scope.selectProductType(productType);
				}).not.toThrow();

				expect(Mocked$location._pathPath).toEqual("/restaurantes/" + productType.url);
				expect(Mocked$location._searchQuery.q).toBeUndefined();
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

			it("should update the page info", function() {
				var called = false;

				scope.updatePageInfo = function() {
					called = true;
				};

				scope.selectProductType({name: "Pizza"});

				expect(called).toBe(true);
			});
		});

		describe("when getting establishments names", function() {
			it("should search for a string", function() {
				scope.searchEstablishmentsNames("pudim", function() {});
				expect(MockedEstablishmentService.query).toEqual("pudim");
			});

			it("should call a callback function", function() {
				var called = false;

				scope.searchEstablishmentsNames("", function() {
					called = true;
				});

				expect(called).toBe(true);
			});
		});

		describe("when updating the page info", function() {
			it("should set the info based on the selected product type", function() {
				scope.searchFilter.productType = "pizza";
				scope.productTypes = [
					{name: "pizza", url: "pizza"}
				];

				scope.updatePageInfo();

				expect(scope.$app.info.title).toContain("pizza");
				expect(scope.$app.info.description).toContain("pizza");
			});

			it("should set the info title based on the searched query", function() {
				scope.searchFilter.query = "pudim";

				scope.updatePageInfo();

				expect(scope.$app.info.title).toContain("pudim");
			});

			it("should set back the original title if needed", function() {
				scope.$app.info.title = "Titulo";
				scope.$app.info.description = "Descrição";

				scope.searchFilter.query = "asdf";
				scope.updatePageInfo();

				scope.searchFilter.query = "";
				scope.updatePageInfo();

				expect(scope.$app.info.title).toEqual("Titulo");
				expect(scope.$app.info.description).toEqual("Descrição");
			});
		});

		describe("when searching for establishments", function() {
			it("should set the searchingEstablishments to true", function() {
				scope.searchingEstablishments = false;
				MockedEstablishmentService.list = function() {
					return {then: function() {}};
				};

				scope.searchEstablishments();
				expect(scope.searchingEstablishments).toBe(true);
			});

			it("should get list of establishments", function() {
				expect(function() {
					scope.searchEstablishments();
				}).not.toThrow();

				expect(scope.establishments).toEqual(MockedEstablishmentService._list);
			});

			it("should clear the selected product type if it has a query to search", function() {
				scope.searchFilter.productType = "Xis";
				scope.searchFilter.query = "Pizzaria";

				scope.searchEstablishments();
				expect(scope.searchFilter.productType).toEqual("");
			});

			it("should change the path and current query search if it has a query to search", function() {
				scope.searchFilter.query = "Pizzaria";

				scope.searchEstablishments();

				expect(Mocked$location._pathPath).toEqual("/restaurantes/");
				expect(Mocked$location._searchQuery["q"]).toEqual(scope.searchFilter.query);
				expect(Mocked$location._replaceCalled).toBe(true);
			});

			it("should track an event in $analytics if it has a query search", function() {
				Mocked$analytics._eventTrackCalled = false;

				scope.searchFilter.query = "Pudim";
				scope.searchEstablishments();

				expect(Mocked$analytics._eventTrackCalled).toBe(true);
				expect(Mocked$analytics._eventTrackEvent).toEqual("Search by Name");
				expect(Mocked$analytics._eventTrackProperties.category).toEqual("Establishment Search");
				expect(Mocked$analytics._eventTrackProperties.label).toEqual("redacted");
			});

			it("should search for a list of establishments using a query object", function() {
				var productType = {name: "Teste", url: "teste"};
				scope.selectProductType(productType);

				scope.searchEstablishments();
				expect(MockedEstablishmentService.query.productType).toEqual(productType.url);

				var query = "Pizzaria";
				scope.searchFilter.query = query;
				scope.searchEstablishments();

				expect(MockedEstablishmentService.query.query).toEqual(query);
			});

			it("should set the searchingEstablishments to false after retriving the list", function() {
				scope.searchingEstablishments = true;
				scope.searchEstablishments();

				expect(scope.searchingEstablishments).toBe(false);
			});

			it("should update the page info", function() {
				var called = false;

				scope.updatePageInfo = function() {
					called = true;
				};

				scope.searchEstablishments();

				expect(called).toBe(true);
			});
		});
	});
});