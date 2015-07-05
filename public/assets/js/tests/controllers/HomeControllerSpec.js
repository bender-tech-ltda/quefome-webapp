"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("HomeController", function() {
		var scope, controller, Mocked$location;
		var MockedEstablishmentService, MockedProductTypeService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			Mocked$location = {
				_currentQuery: {},
				_currentLocation: "",

				path: function(location) {
					if (location) {
						this._currentLocation = location;
						return this;
					}

					return this._currentLocation;
				},

				search: function(query, value) {
					if (query) {
						this._currentQuery = query;
						return this;
					}

					return this._currentQuery;
				}
			};

			MockedEstablishmentService = {
				query: null,
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
			var params = {
				$location: Mocked$location,
				EstablishmentService: MockedEstablishmentService,
				ProductTypeService: MockedProductTypeService
			};
			return injectController("HomeController", "views/partials/home/index.html", params, function($scope) {
				scope = $scope;
			});
		});

		it("should have a productTypes property", function() {
			expect(scope.productTypes).toBeDefined();
		});

		it("should have a query property", function() {
			expect(scope.query).toBeDefined();
		});

		it("should have a loadingProductTypes property", function() {
			expect(scope.loadingProductTypes).toBeDefined();
		});

		it("should have a searchingEstablishments property", function() {
			expect(scope.searchingEstablishments).toBeDefined();
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

		describe("when searching for establishments", function() {
			beforeEach(function() {
				scope.$digest = function(callback) {
					callback();
				};
			});

			it("should the the searchingEstablishments to true", function() {
				scope.searchingEstablishments = false;
				scope.$digest = function() {};

				scope.searchEstablishments();
				expect(scope.searchingEstablishments).toBe(true);
			});


			it("should send the user to the search establishments page", function() {
				scope.searchEstablishments();
				expect(Mocked$location.path()).toEqual("/establishments/search");
			});

			it("and should set the 'q' search property", function() {
				scope.query = "teste";
				scope.searchEstablishments();

				expect(Mocked$location.search().q).toEqual(scope.query);
			});
		});

		it("should get the list of productTypes from service on startup", function() {
			expect(MockedProductTypeService.called).toBe(true);
			expect(scope.productTypes).toEqual(MockedProductTypeService._list);
		});
	});
});