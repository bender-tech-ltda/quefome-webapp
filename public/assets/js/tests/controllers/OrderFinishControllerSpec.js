"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("OrderFinishController", function() {
		var scope, controller;
		var Mocked$location, Mocked$routeParams;
		var MockedAuthService, MockedEstablishmentService, MockedOrderService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			Mocked$routeParams = {
				establishmentUrl: "url-restaurante"
			};

			Mocked$location = {
				_currentPath: "",
				path: function(location) {
					this._currentPath = location;
					return this;
				}
			};

			MockedAuthService = {
				_currentUser: {name: "Teste"},
				_isLoggedCalled: false,
				isLogged: function() {
					this._isLoggedCalled = true;
					return this._currentUser ? true : false;
				}
			};

			MockedEstablishmentService = {
				_findByUrlCalled: false,
				_findByUrlUrl: null,
				_findByUrlEstablishment: {id: -42, name: "Teste"},
				_findByUrlNotFound: true,
				findByUrl: function(url) {
					this._findByUrlCalled = true;
					this._findByUrlUrl = url;

					var establishment = this._findByUrlEstablishment;
					var notFound = this._findByUrlNotFound;

					return {
						then: function(successCallback, failCallback) {
							if (establishment) {
								successCallback(establishment);
							} else {
								failCallback({
									isNotFoundError: notFound
								});
							}
						}
					};
				}
			};

			MockedOrderService = {
				_retrieveOrder: {items: [
					{product: {id: -1}}
				]},
				_retrieveEstablishment: null,
				retrieve: function(establishment) {
					this._retrieveEstablishment = establishment;
					return this._retrieveOrder;
				}
			};
		});

		beforeEach(function() {
			var params = {
				$routeParams: Mocked$routeParams,
				$location: Mocked$location,
				AuthService: MockedAuthService,
				EstablishmentService: MockedEstablishmentService,
				OrderService: MockedOrderService
			};

			return injectController("OrderFinishController", false, params, function($scope) {
				scope = $scope;
			});
		});

		it("should have an establishment property", function() {
			expect(scope.establishment).toBeDefined();
		});

		it("should have an establishmentNotFound property", function() {
			expect(scope.establishmentNotFound).toBeDefined();
		});

		it("should have an order property", function() {
			expect(scope.order).toBeDefined();
		});

		describe("on startup", function() {
			it("should check if the user is logged", function() {
				MockedAuthService._isLoggedCalled = false;
				scope.startup();

				expect(MockedAuthService._isLoggedCalled).toBe(true);
			});

			it("should redirect to the establishment page if the user is not logged in", function() {
				MockedAuthService._currentUser = null;
				scope.startup();

				expect(Mocked$location._currentPath).toEqual("/establishments/" + Mocked$routeParams.establishmentUrl);
			});

			it("should search for the establishment using the $routeParams.establishmentUrl", function() {
				MockedEstablishmentService._findByUrlCalled = false;
				MockedEstablishmentService._findByUrlEstablishment = {id: -2};

				scope.startup();

				expect(MockedEstablishmentService._findByUrlCalled).toBe(true);
				expect(scope.establishment).toEqual(MockedEstablishmentService._findByUrlEstablishment);
			});

			it("should set not found if the establishment was not found", function() {
				MockedEstablishmentService._findByUrlEstablishment = false;
				scope.startup();

				expect(scope.establishmentNotFound).toBe(true);
			});

			it("should retrieve the establishment order", function() {
				scope.startup();

				expect(MockedOrderService._retrieveEstablishment).toEqual(scope.establishment);
				expect(scope.order).toEqual(MockedOrderService._retrieveOrder);
			});

			it("should redirect to the establishment page if the order doesn't exists", function() {
				MockedOrderService._retrieveOrder = null;
				scope.startup();

				expect(Mocked$location._currentPath).toEqual("/establishments/" + Mocked$routeParams.establishmentUrl);
			});

			it("should redirect to the establishment page if the order doesn't have items", function() {
				MockedOrderService._retrieveOrder = {items: []};
				scope.startup();

				expect(Mocked$location._currentPath).toEqual("/establishments/" + Mocked$routeParams.establishmentUrl);
			});
		});
	});
});