"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("OrderTrackController", function() {
		var scope, controller;
		var Mocked$timeout;
		var MockedDialog;
		var MockedAuthService, MockedOrderService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			Mocked$timeout = function(callback, time) {
				Mocked$timeout._lastCallback = callback;
				Mocked$timeout._lastTime = time;
			};

			Mocked$timeout._lastCallback = null;
			Mocked$timeout._lastTime = null;

			MockedDialog = {
				_called: false,
				_params: null,
				create: function(params) {
					this._called = true;
					this._params = params;
				}
			};

			MockedAuthService = {
				_currentUser: null,
				_isLoggedCalled: false,
				isLogged: function() {
					this._isLoggedCalled = true;
					return this._currentUser ? true : false;
				},

				_hasCheckedForLoggedUser: false,
				_hasCheckedForLoggedUserCalled: false,
				hasCheckedForLoggedUser: function() {
					this._hasCheckedForLoggedUserCalled = true;
					return this._hasCheckedForLoggedUser;
				}
			};

			MockedOrderService = {
				_listCalled: false,
				_listOrders: [],
				list: function() {
					this._listCalled = true;

					var orders = this._listOrders;

					return {
						then: function(success) {
							success(orders);
						}
					};
				}
			};
		});

		beforeEach(function() {
			var params = {
				$timeout: Mocked$timeout,
				Dialog: MockedDialog,
				AuthService: MockedAuthService,
				OrderService: MockedOrderService
			};

			return injectController("OrderTrackController", false, params, function($scope) {
				scope = $scope;
			});
		});

		it("should have a orders property", function() {
			expect(scope.orders).toBeDefined();
		});

		it("should have a orders property", function() {
			expect(scope.orders).toBeDefined();
		});

		it("should have a ordersSearched property", function() {
			expect(scope.ordersSearched).toBeDefined();
		});

		it("should have a searchingOrders property", function() {
			expect(scope.searchingOrders).toBeDefined();
		});

		describe("on startup", function() {
			it("shuould search for the user orders", function() {
				var called = false;

				scope.refreshOrders = function() {
					called = true;
				};

				scope.startup();
				expect(called).toBe(true);
			});
		});

		describe("when verifing if login was checked", function() {
			it("should check with the AuthService", function() {
				MockedAuthService._hasCheckedForLoggedUserCalled = false;
				scope.isLoginChecked();

				expect(MockedAuthService._hasCheckedForLoggedUserCalled).toBe(true);
			});
		});

		describe("when verifing if the user is logged in", function() {
			it("should check with the AuthService", function() {
				MockedAuthService._isLoggedCalled = false;
				scope.isUserLogged();

				expect(MockedAuthService._isLoggedCalled).toBe(true);
			});
		});

		describe("when log in", function() {
			it("should call the login dialog", function() {
				MockedDialog._called = false;

				scope.login();
				expect(MockedDialog._called).toBe(true);
				expect(MockedDialog._params.templateUrl.indexOf("login")).toBeGreaterThan(-1);
				expect(MockedDialog._params.show).toBe(true);
			});
		});

		describe("when refreshing the user orders", function() {
			beforeEach(function() {
				MockedAuthService._currentUser = {id: -5, email: "teste@teste.com"};
			});

			it("should check if the user is logged in", function() {
				MockedAuthService._isLoggedCalled = false;
				scope.refreshOrders();

				expect(MockedAuthService._isLoggedCalled).toBe(true);
			});

			it("should skip the refresh if the user is not logged in", function() {
				MockedAuthService._currentUser = null;
				MockedOrderService._listCalled = false;

				scope.refreshOrders();

				expect(MockedOrderService._listCalled).toBe(false);
			});

			it("should set searchingOrders to true", function() {
				scope.searchingOrders = false;
				MockedOrderService.list = function() {
					return {then: function() {}};
				};

				scope.refreshOrders();
				expect(scope.searchingOrders).toBe(true);
			});

			it("should set searchingOrders to false if finished", function() {
				scope.searchingOrders = true;
				scope.refreshOrders();
				expect(scope.searchingOrders).toBe(false);

				MockedOrderService.list = function() {
					return {then: function(sucess, fail) {
						fail();
					}};
				};

				scope.refreshOrders();
				expect(scope.searchingOrders).toBe(false);
			});

			it("should set ordersSearched to true if finished with success", function() {
				scope.ordersSearched = false;
				scope.refreshOrders();
				expect(scope.ordersSearched).toBe(true);
			});

			it("should search for the user orders", function() {
				MockedOrderService._listCalled = false;
				MockedOrderService._listOrders = [{id: -4}];

				scope.refreshOrders();

				expect(MockedOrderService._listCalled).toBe(true);
				expect(scope.orders).toEqual(MockedOrderService._listOrders);
			});

			it("should keep refreshing the user orders from time to time", function() {
				scope.refreshOrders();

				expect(Mocked$timeout._lastTime).toBeGreaterThan(0);
				expect(typeof(Mocked$timeout._lastCallback)).toEqual("function");
			});
		});
	});
});