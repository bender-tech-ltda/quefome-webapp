"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("SearchEstablishmentController", function() {
		var scope, controller, MockedProductTypeService, MockedEstablishmentService, Mocked$location, Mocked$filter;

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

			Mocked$filter = function() {
				return Mocked$filter.parseFunction;
			};

			Mocked$filter.parseFunction = function(value) {
				return value + "";
			};
		});

		beforeEach(function() {
			var params = {
				ProductTypeService: MockedProductTypeService,
				EstablishmentService: MockedEstablishmentService,
				$location: Mocked$location,
				$filter: Mocked$filter
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
					name: "Teste"
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
					name: "Teste"
				};

				expect(function() {
					scope.selectProductType(productType);
				}).not.toThrow();

				expect(Mocked$location.search("product-type")).toEqual(productType.name);
				expect(Mocked$location.search("q")).toBeUndefined();
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

		describe("when searching for stablishments", function() {
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

			it("and set change the current query search", function() {
				scope.searchFilter.query = "Pizzaria";

				scope.searchEstablishments();
				expect(Mocked$location.search("q")).toEqual(scope.searchFilter.query);
				expect(Mocked$location.search("productType")).toBeUndefined();
			});

			it("should search for a list of establishments using a query object", function() {
				var productType = {name: "Teste"};
				scope.selectProductType(productType);

				scope.searchEstablishments();
				expect(MockedEstablishmentService.query.productType).toEqual(productType.name);

				var query = "Pizzaria";
				scope.searchFilter.query = query;
				scope.searchEstablishments();

				expect(MockedEstablishmentService.query.query).toEqual(query);
			});
		});

		describe("when formatting the current schedule", function() {
			var establishment, WeekDay;

			var formatTime = function(value) {
				var hours = value.getHours();
				if (hours < 10) {
					hours = "0" + hours;
				}

				var minutes = value.getMinutes();
				if (minutes < 10) {
					minutes = "0" + minutes;
				}

				return hours + ":" + minutes;
			};

			beforeEach(function() {
				establishment = {};
				establishment.parameters = {};

				WeekDay = [];
				WeekDay[0] = {number: 0, name: "Domingo"};
				WeekDay[1] = {number: 1, name: "Segunda"};
				WeekDay[2] = {number: 2, name: "Terça"};
				WeekDay[3] = {number: 3, name: "Quarta"};
				WeekDay[4] = {number: 4, name: "Quinta"};
				WeekDay[5] = {number: 5, name: "Sexta"};
				WeekDay[6] = {number: 6, name: "Sábado"};

				Mocked$filter.parseFunction = function(value) {
					return formatTime(value);
				};
			});

			it("should return the schedule time if the establishment is open", function() {
				establishment.parameters.status = 'OPEN';
				establishment.parameters.currentSchedule = {};

				establishment.parameters.currentSchedule.weekDay = WeekDay[(new Date).getDay()];
				establishment.parameters.currentSchedule.openingTime = new Date();
				establishment.parameters.currentSchedule.openingTime.setHours(19, 30);
				establishment.parameters.currentSchedule.closingTime = new Date();
				establishment.parameters.currentSchedule.closingTime.setHours(23, 15);

				var result = scope.formatCurrentSchedule(establishment);
				expect(result).toEqual("19:30 até 23:15");
			});

			it("should return the today schedule time if the establishment is closed and opens today", function() {
				establishment.parameters.status = 'CLOSED';
				establishment.parameters.currentSchedule = {};

				establishment.parameters.currentSchedule.weekDay = WeekDay[(new Date).getDay()];
				establishment.parameters.currentSchedule.openingTime = new Date();
				establishment.parameters.currentSchedule.openingTime.setHours(establishment.parameters.currentSchedule.openingTime.getHours() + 1, 0);

				var result = scope.formatCurrentSchedule(establishment);
				expect(result).toEqual("Abrirá hoje, às " + formatTime(establishment.parameters.currentSchedule.openingTime));
			});

			it("should return the tomorrow schedule time if the establishment is closed and opens tomorrow", function() {
				establishment.parameters.status = 'CLOSED';
				establishment.parameters.currentSchedule = {};

				establishment.parameters.currentSchedule.openingTime = new Date();
				establishment.parameters.currentSchedule.openingTime.setDate(establishment.parameters.currentSchedule.openingTime.getDate() + 1);
				establishment.parameters.currentSchedule.openingTime.setHours(18, 0);
				establishment.parameters.currentSchedule.weekDay = WeekDay[establishment.parameters.currentSchedule.openingTime.getDay()];

				var result = scope.formatCurrentSchedule(establishment);
				expect(result).toEqual("Abrirá amanhã, às 18:00");
			});

			it("should return the day of the week schedule that the establishment will open if it is a diferent day of the week", function() {
				establishment.parameters.status = 'CLOSED';
				establishment.parameters.currentSchedule = {};

				establishment.parameters.currentSchedule.openingTime = new Date();
				establishment.parameters.currentSchedule.openingTime.setDate(establishment.parameters.currentSchedule.openingTime.getDate() + 2);
				establishment.parameters.currentSchedule.openingTime.setHours(18, 0);
				establishment.parameters.currentSchedule.weekDay = WeekDay[establishment.parameters.currentSchedule.openingTime.getDay()];

				var result = scope.formatCurrentSchedule(establishment);
				expect(result).toEqual("Abrirá " + establishment.parameters.currentSchedule.weekDay.name + ", às 18:00");
			});

			it("should return the day of the week schedule that the establishment will open if the time has passed", function() {
				establishment.parameters.status = 'CLOSED';
				establishment.parameters.currentSchedule = {};

				establishment.parameters.currentSchedule.openingTime = new Date();
				establishment.parameters.currentSchedule.openingTime.setHours(establishment.parameters.currentSchedule.openingTime.getHours() - 1, 0);
				establishment.parameters.currentSchedule.weekDay = WeekDay[establishment.parameters.currentSchedule.openingTime.getDay()];

				var result = scope.formatCurrentSchedule(establishment);
				expect(result).toEqual("Abrirá " + establishment.parameters.currentSchedule.weekDay.name + ", às " + formatTime(establishment.parameters.currentSchedule.openingTime));
			});

		});

		describe("when formatting the delivery time", function() {
			var establishment;

			beforeEach(function() {
				establishment = {};
				establishment.parameters = {};
			});

			it("should use the minimum time when the maximum time is not present", function() {
				establishment.parameters.minimumDeliveryTime = 10;

				var result = scope.formatDeliveryTime(establishment);
				expect(result).toEqual(establishment.parameters.minimumDeliveryTime + "min.");
			});

			it("should use the maximum time when the minimum time is not present", function() {
				establishment.parameters.maximumDeliveryTime = 20;

				var result = scope.formatDeliveryTime(establishment);
				expect(result).toEqual(establishment.parameters.maximumDeliveryTime + "min.");
			});

			it("should return 0 when minimum and maximum time is not present", function() {
				var result = scope.formatDeliveryTime(establishment);
				expect(result).toEqual("0min.");
			});

			it("should return on time if the minimum and maximum time are equal", function() {
				establishment.parameters.minimumDeliveryTime = 30;
				establishment.parameters.maximumDeliveryTime = 30;

				var result = scope.formatDeliveryTime(establishment);
				expect(result).toEqual(establishment.parameters.minimumDeliveryTime + "min.");
			});

			it("should return minimum and maximum time if they are different", function() {
				establishment.parameters.minimumDeliveryTime = 30;
				establishment.parameters.maximumDeliveryTime = 70;

				var result = scope.formatDeliveryTime(establishment);
				expect(result).toEqual(establishment.parameters.minimumDeliveryTime + " à " + establishment.parameters.maximumDeliveryTime + "min.");
			});
		});

		describe("when formatting money", function() {
			beforeEach(function() {
				Mocked$filter.parseFunction = function(value) {
					return value.toFixed(2);
				}
			});

			it("should replace the point by a comma", function() {
				var result = scope.formatMoney(2.10);
				expect(result).toEqual("2,10");
			});

			it("should ifgnore the thousand separator", function() {
				var result = scope.formatMoney(100000);
				expect(result).toEqual("100000,00");
			});

			it("should have two decimal digits", function() {
				var result = scope.formatMoney(2);
				expect(result).toEqual("2,00");

				result = scope.formatMoney(10.3);
				expect(result).toEqual("10,30");
			});
		});
	});
});