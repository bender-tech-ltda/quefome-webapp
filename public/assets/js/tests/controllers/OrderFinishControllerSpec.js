"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("OrderFinishController", function() {
		var scope, controller;
		var Mocked$location, Mocked$routeParams;
		var MockedAuthService, MockedEstablishmentService, MockedOrderService, MockedAddressService;

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
				},

				getUser: function() {
					return this._currentUser;
				},

				_hasCheckedForLoggedUser: false,
				hasCheckedForLoggedUser: function() {
					return this._hasCheckedForLoggedUser;
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
				},

				_isAttendind: true,
				_isAttendingCalled: false,
				isAttendingAddress: function(establishment, address) {
					if (!address) {
						address = {};
					}

					this._isAttendingCalled = true;
					var attend = this._isAttendind;

					return {
						then: function(callback) {
							callback(attend);
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
				},

				_getOrderPriceCalled: false,
				_getOrderPriceOrder: null,
				getOrderPrice: function(order) {
					this._getOrderPriceCalled = true;
					this._getOrderPriceOrder = order;
				},

				_createCalled: false,
				_createOrder: null,
				_createSuccess: true,
				create: function(order) {
					this._createCalled = true;
					this._createOrder = order;

					var createSuccess = this._createSuccess;

					return {
						then: function(success, fail) {
							if (createSuccess) {
								success();
							} else {
								fail();
							}
						}
					};
				}
			};

			MockedAddressService = {
				_searchZipCodeAddress: {address: "Rua Marechal Camara", neighborhood: "Ideal", zipCode: "93336220"},
				_searchZipCodeZipCode: null,
				_searchZipCodeCalled: false,
				searchZipCode: function(zipCode) {
					this._searchZipCodeCalled = true;
					this._searchZipCodeZipCode = zipCode;

					var address = this._searchZipCodeAddress;

					return {
						then: function(success, fail) {
							if (address) {
								success(address);
							} else {
								fail();
							}
						}
					};
				},

				_searchAddressZipCode: "93336220",
				_searchAddressAddress: null,
				_searchAddressCalled: false,
				searchAddress: function(address) {
					this._searchAddressCalled = true;
					this._searchAddressAddress = address;

					address.zipCode = this._searchAddressZipCode;

					return {
						then: function(success, fail) {
							if (address.zipCode) {
								success(address);
							} else {
								fail();
							}
						}
					};
				},

				_currentAddress: false,
				_setCurrentAddressCalled: false,
				setCurrentAddress: function(address) {
					this._setCurrentAddressCalled = true;
					this._currentAddress = address;
				},
				_getCurrentAddressCalled: false,
				getCurrentAddress: function() {
					this._getCurrentAddressCalled = true;
					return this._currentAddress;
				}
			};
		});

		beforeEach(function() {
			var params = {
				$routeParams: Mocked$routeParams,
				$location: Mocked$location,
				AuthService: MockedAuthService,
				EstablishmentService: MockedEstablishmentService,
				OrderService: MockedOrderService,
				AddressService: MockedAddressService
			};

			return injectController("OrderFinishController", "views/partials/orders/finish.html", params, function($scope) {
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

		it("should have an addressInputMethod property", function() {
			expect(scope.addressInputMethod).toBeDefined();
		});

		it("should have an address property", function() {
			expect(scope.address).toBeDefined();
		});

		it("should have an addressStatus property", function() {
			expect(scope.addressStatus).toBeDefined();
		});

		it("should have an processingOrder property", function() {
			expect(scope.processingOrder).toBeDefined();
		});

		it("should have an paymentCategories property", function() {
			expect(scope.paymentCategories).toBeDefined();
		});

		it("should have an errorProcessingOrder property", function() {
			expect(scope.errorProcessingOrder).toBeDefined();
		});

		describe("on startup", function() {
			it("should not be called if the user login was not checked yet", function() {
				var called = false;
				scope.startup = function() {
					called = true;
				};

				expect(called).toBe(false);
			});

			it("and should be called when the $userLoginChecked event is triggered", function() {
				var called = false;
				scope.startup = function() {
					called = true;
				};

				scope.$broadcast("$userLoginChecked");
				expect(called).toBe(true);
			});

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

			it("should set the order user with the logged user", function() {
				MockedOrderService._retrieveOrder = {items: [{}]};
				MockedAuthService._currentUser = {name: "Bla", phone: "5135934949"};

				scope.startup();

				expect(scope.order.phone).toEqual(MockedAuthService._currentUser.phone);
			});

			it("should get the current address and set in the address", function() {
				MockedAddressService._getCurrentAddressCalled = false;
				MockedAddressService._currentAddress = {zipCode: "99999-999", address: "Rua Tal"};

				scope.changeDeliveryType = function() {};

				scope.startup();

				expect(MockedAddressService._getCurrentAddressCalled).toBe(true);
				expect(scope.address.zipCode).toEqual(MockedAddressService._currentAddress.zipCode);
				expect(scope.address.address).toEqual(MockedAddressService._currentAddress.address);
			});

			it("should ignore the address if it was skipped", function() {
				MockedAddressService._getCurrentAddressCalled = false;
				MockedAddressService._currentAddress = {skipped: true};
				scope.startup();

				expect(scope.address.zipCode).toEqual("");
				expect(scope.address.address).toEqual("");
			});

			it("should call the categorizePaymentMethods function", function() {
				var called = false;
				scope.categorizePaymentMethods = function() {
					called = true;
				};

				scope.startup();
				expect(called).toBe(true);
			});

			it("should call the changeDeliveryType function", function() {
				var called = false;
				scope.changeDeliveryType = function() {
					called = true;
				};

				scope.startup();
				expect(called).toBe(true);
			});

			it("should set the order.withdraw to false if the establishment doesn't accept withdraw", function() {
				scope.establishment = {
					parameters: {canWithdraw: false}
				};

				MockedOrderService._retrieveOrder = {items: [{}], withdraw: true};

				scope.startup();
				expect(scope.order.withdraw).toBe(false);
			});

			it("should set the order.withdraw to false if it is undefined", function() {
				MockedOrderService._retrieveOrder = {items: [{}]};

				scope.startup();
				expect(scope.order.withdraw).toBe(false);
			});
		});

		describe("when categorizing the payment method", function() {
			beforeEach(function() {
				scope.establishment = {
					parameters: {}
				};
			});

			it("should use the establishment parameters", function() {
				scope.establishment.parameters.paymentMethods = [
					{category: {name: "Teste"}}
				];

				scope.categorizePaymentMethods();

				expect(scope.paymentCategories.length).toEqual(1);
			});

			it("should categorize by name", function() {
				scope.establishment.parameters.paymentMethods = [
					{category: {name: "Cartão"}},
					{category: {name: "Dinheiro"}},
					{category: {name: "Cartão"}}
				];

				scope.categorizePaymentMethods();

				expect(scope.paymentCategories.length).toEqual(2);
				expect(scope.paymentCategories[0].paymentMethods.length).toEqual(2);
				expect(scope.paymentCategories[1].paymentMethods.length).toEqual(1);
			});
		});

		describe("when showing the change field", function() {
			it("should not show if it has no payment method selected", function() {
				scope.order.paymentMethod = null;

				var result = scope.showChangeField({hasChange: true});
				expect(result).toBe(false);
			});

			it("should not show if the payment category doesnt has change", function() {
				scope.order.paymentMethod = {};

				var result = scope.showChangeField({hasChange: false});
				expect(result).toBe(false);
			});

			it("should not show if the selected payment method doesnt exists in the payment category", function() {
				var category = {
					hasChange: true,
					paymentMethods: [
						{name: "Dinheiro"}
					]
				};

				scope.order.paymentMethod = {name: "Mastercard"};

				var result = scope.showChangeField(category);
				expect(result).toBe(false);
			});

			it("should show if the selected payment method exists in the payment category", function() {
				var category = {
					hasChange: true,
					paymentMethods: [
						{name: "Mastercard"},
						{name: "Visa"}
					]
				};

				scope.order.paymentMethod = category.paymentMethods[0];

				var result = scope.showChangeField(category);
				expect(result).toBe(true);
			});
		});

		describe("when checking if the change field is invalid", function() {
			it("should get the field based on the category key", function() {
				scope.paymentCategories = [
					{key: "cartao", name: "Cartão"}
				];

				scope.order.change = 50;
				scope.$digest();

				var result = scope.isFieldChangeInvalid(scope.paymentCategories[0]);
				expect(result).toBe(false);
			});

			it("should be false if the input is not dirty", function() {
				scope.paymentCategories = [
					{key: "cartao", name: "Cartão"}
				];

				scope.$digest();

				scope.paymentForm["change-cartao"].$dirty = false;
				scope.paymentForm["change-cartao"].$invalid = true;

				var result = scope.isFieldChangeInvalid(scope.paymentCategories[0]);
				expect(result).toBe(false);
			});

			it("should be true if the input is dirty and invalid", function() {
				scope.paymentCategories = [
					{key: "cartao", name: "Cartão"}
				];

				scope.$digest();

				scope.paymentForm["change-cartao"].$dirty = true;
				scope.paymentForm["change-cartao"].$invalid = true;

				var result = scope.isFieldChangeInvalid(scope.paymentCategories[0]);
				expect(result).toBe(true);
			});
		});

		describe("when changing the delivery type", function() {
			describe("when it is withdraw", function() {
				beforeEach(function() {
					scope.order.withdraw = true;
				});

				it("should clear the address", function() {
					scope.lastDeliveryType = null;

					scope.order.address = {};
					scope.changeDeliveryType();

					expect(scope.order.address).toBeNull();
				});
			});

			describe("when it is not withdraw", function() {
				beforeEach(function() {
					scope.order.withdraw = false;
				});

				it("should set the lastAddressInputMethod to null", function() {
					scope.lastAddressInputMethod = "address";

					scope.changeAddressInputMethod = function() {};

					scope.changeDeliveryType();
					expect(scope.lastAddressInputMethod).toBeNull();
				});

				it("should trigger changeDeliveryType", function() {
					scope.lastDeliveryType = null;

					var called = false;
					scope.changeAddressInputMethod = function() {
						called = true;
					};

					scope.changeDeliveryType();

					expect(called).toBe(true);
				});
			});
		});

		describe("when checking the zip code", function() {
			beforeEach(function() {
				scope.address = {};
				scope.$digest();
			});

			it("should validate the zip code", function() {
				scope.address.zipCode = "";
				scope.$digest();

				scope.checkZipCode();
				expect(scope.addressStatus.addressChecked).toBe(false);

				scope.address.zipCode = "abc";
				scope.$digest();

				scope.checkZipCode();
				expect(scope.addressStatus.addressChecked).toBe(false);
			});

			it("should set processing to true", function() {
				scope.address.zipCode = "93336-220";
				scope.$digest();

				MockedAddressService.searchZipCode = function() {
					return {then: function() {}}
				};

				scope.checkZipCode();
				expect(scope.addressStatus.processing).toBe(true);
			});

			it("should search using the informed zipCode", function() {
				scope.address.zipCode = "93336-220";
				scope.$digest();

				MockedAddressService._searchZipCodeAddress.zipCode = scope.address.zipCode;

				scope.checkZipCode();

				expect(MockedAddressService._searchZipCodeCalled).toBe(true);
				expect(MockedAddressService._searchZipCodeZipCode).toEqual(scope.address.zipCode);
			});

			describe("when zip code is invalid", function() {
				beforeEach(function() {
					scope.address.zipCode = "99999-999";
					scope.$digest();

					MockedAddressService._searchZipCodeAddress = null;
				});

				it("should set processing to false", function() {
					scope.addressStatus.processing = true;

					scope.checkZipCode();
					expect(scope.addressStatus.processing).toBe(false);
				});

				it("should set zip code checked", function() {
					scope.addressStatus.zipCodeChecked = false;

					scope.checkZipCode();
					expect(scope.addressStatus.zipCodeChecked).toBe(true);
				});

				it("should set zipCode invalid", function() {
					scope.addressStatus.zipCodeValid = true;

					scope.checkZipCode();
					expect(scope.addressStatus.zipCodeValid).toBe(false);
				});

				it("should clear the order address", function() {
					scope.order.address = {};
					scope.checkZipCode();

					expect(scope.order.address).toBeNull();
				});
			});

			describe("when zip code is valid", function() {
				beforeEach(function() {
					scope.address.zipCode = "99999-999";
					scope.$digest();

					MockedAddressService._searchZipCodeAddress = {
						zipCode: "99999-999",
						addresss: "Rua Tal"
					};
				});

				it("should check if the address is attended", function() {
					var called = false;

					scope.checkIfEstablishmentAttendsTheAddress = function() {
						called = true;
					};

					scope.checkZipCode();
					expect(called).toBe(true);
				});
			});
		});

		describe("when checking address", function() {
			beforeEach(function() {
				scope.address = {};
				scope.$digest();
			});

			it("should validate the address", function() {
				scope.address.address = "";
				scope.$digest();

				scope.checkAddress();
				expect(scope.addressStatus.addressChecked).toBe(false);
			});

			it("should set processing to true", function() {
				scope.address.address = "Rua tal";
				scope.$digest();

				MockedAddressService.searchAddress = function() {
					return {then: function() {}}
				};

				scope.checkAddress();
				expect(scope.addressStatus.processing).toBe(true);
			});

			it("should search using the informed address", function() {
				scope.address.address = "Rua Tal";
				scope.$digest();

				scope.checkAddress();

				expect(MockedAddressService._searchAddressCalled).toBe(true);
				expect(MockedAddressService._searchAddressAddress.address).toEqual(scope.order.address.address);
			});

			describe("when address is invalid", function() {
				beforeEach(function() {
					scope.address.address = "Av. Principal";
					scope.$digest();

					MockedAddressService._searchAddressZipCode = null;
				});

				it("should set processing to false", function() {
					scope.addressStatus.processing = true;

					scope.checkAddress();
					expect(scope.addressStatus.processing).toBe(false);
				});

				it("should set address checked", function() {
					scope.addressStatus.addressChecked = false;

					scope.checkAddress();
					expect(scope.addressStatus.addressChecked).toBe(true);
				});

				it("should set address invalid", function() {
					scope.addressStatus.addressValid = true;

					scope.checkAddress();
					expect(scope.addressStatus.addressValid).toBe(false);
				});

				it("should clear the order address", function() {
					scope.order.address = {};
					scope.checkAddress();

					expect(scope.order.address).toBeNull();
				});
			});

			describe("when address is valid", function() {
				beforeEach(function() {
					scope.address.address = "Rua Doze";
					scope.$digest();

					MockedAddressService._searchAddressZipCode = "99999-999";
				});

				it("should check if the address is attended", function() {
					var called = false;

					scope.checkIfEstablishmentAttendsTheAddress = function() {
						called = true;
					};

					scope.checkAddress();
					expect(called).toBe(true);
				});
			});
		});

		describe("when checking if the establishment attends the address", function() {
			var address;

			beforeEach(function() {
				address = {
					address: "Rua Tal", 
					zipCode: "99999-999", 
					neighborhood: "Teste", 
					city: {name: "POA"}
				};
			});

			it("should set the order address", function() {
				scope.checkIfEstablishmentAttendsTheAddress(address);

				expect(scope.order.address.zipCode).toEqual(address.zipCode);
				expect(scope.order.address.address).toEqual(address.address);
				expect(scope.order.address.neighborhood.name).toEqual(address.neighborhood);
				expect(scope.order.address.city).toEqual(address.city);
			});

			it("should set processing to true", function() {
				scope.addressStatus.processing = false;
				MockedEstablishmentService.isAttendingAddress = function() {
					return {then: function() {}};
				};

				scope.checkIfEstablishmentAttendsTheAddress(address);
				expect(scope.addressStatus.processing).toBe(true);
			});

			it("should set the current address", function() {
				scope.checkIfEstablishmentAttendsTheAddress(address);
				expect(MockedAddressService._currentAddress).toEqual(address);
			});

			it("should set the check the address", function() {
				scope.checkIfEstablishmentAttendsTheAddress(address);
				expect(MockedEstablishmentService._isAttendingCalled).toBe(true);
			});

			describe("when the address is attended", function() {
				beforeEach(function() {
					MockedEstablishmentService._isAttendind = true;
				});

				it("should set the processing to false", function() {
					scope.checkIfEstablishmentAttendsTheAddress(address);
					expect(scope.addressStatus.processing).toBe(false);
				});

				it("should set the address atended to true", function() {
					scope.checkIfEstablishmentAttendsTheAddress(address);
					expect(scope.addressStatus.addressAttended).toBe(true);
				});
			});

			describe("when the address is not attended", function() {
				beforeEach(function() {
					MockedEstablishmentService._isAttendind = false;
				});

				it("should set the processing to false", function() {
					scope.checkIfEstablishmentAttendsTheAddress(address);
					expect(scope.addressStatus.processing).toBe(false);
				});

				it("should set the address atended to false", function() {
					scope.checkIfEstablishmentAttendsTheAddress(address);
					expect(scope.addressStatus.addressAttended).toBe(false);
				});
			});
		});

		describe("when changing the address input method", function() {
			describe("and is zip-code", function() {
				beforeEach(function() {
					scope.addressInputMethod = 'zip-code';
				});

				it("should set the zip code checked and zipCodeValid to false", function() {
					scope.lastAddressInputMethod = null;

					scope.changeAddressInputMethod();

					expect(scope.addressStatus.zipCodeChecked).toBe(false);
					expect(scope.addressStatus.zipCodeValid).toBe(false);
				});

				it("should check the zip code if the zip code is filled", function() {
					scope.lastAddressInputMethod = null;

					var called = false;
					scope.checkZipCode = function() {
						called = true;
					};

					scope.address.zipCode = "99999-999";
					scope.$digest();

					scope.changeAddressInputMethod();

					expect(called).toBe(true);
				});
			});

			describe("and is address", function() {
				beforeEach(function() {
					scope.addressInputMethod = 'address';
				});

				it("should set the address checked and address valid to false", function() {
					scope.lastAddressInputMethod = null;

					scope.changeAddressInputMethod();

					expect(scope.addressStatus.addressChecked).toBe(false);
					expect(scope.addressStatus.addressValid).toBe(false);
				});

				it("should check the address if the address is filled", function() {
					scope.lastAddressInputMethod = null;

					var called = false;
					scope.checkAddress = function() {
						called = true;
					};

					scope.address.address = "Rua 666";
					scope.$digest();

					scope.changeAddressInputMethod();

					expect(called).toBe(true);
				});
			});
		});

		describe("when getting the order price", function() {
			it("should call the OrderService", function() {
				scope.getOrderTotalPrice();
				expect(MockedOrderService._getOrderPriceCalled).toBe(true);
			});

			it("should pass the order as parameter", function() {
				scope.order = {id: -2};
				scope.getOrderTotalPrice();

				expect(MockedOrderService._getOrderPriceOrder).toEqual(scope.order);
			});
		});

		describe("when going to the establishment page", function() {
			it("should use the $routeParams", function() {
				scope.goToEstablishmentPage();
				expect(Mocked$location._currentPath).toEqual("/establishments/" + Mocked$routeParams.establishmentUrl);
			});
		});

		describe("when the user logout", function() {
			it("should go to the establishment page", function() {
				scope.$broadcast("$userLogout");
				expect(Mocked$location._currentPath).toEqual("/establishments/" + Mocked$routeParams.establishmentUrl);
			});
		});

		describe("when checking if the order finish is valid", function() {
			beforeEach(function() {
				scope.order = {
					withdraw: false,
					address: {number: "363"},
					phone: "30305488",
					paymentMethod: {name: "Dinheiro"}
				};
			});

			it("should return if the address, phone and payment method were informed", function() {
				var result = scope.isFinishValid();
				expect(result).toBe(true);
			});

			it("should return false if there is no order", function() {
				scope.order = null;
				var result = scope.isFinishValid();

				expect(result).toBe(false);
			});

			it("should return false if it's not going to be withdraw and the order doesnt have an address", function() {
				scope.order.withdraw = false;
				scope.order.address = null;

				var result = scope.isFinishValid();

				expect(result).toBe(false);
			});

			it("should return false if it's not going to be withdraw and the order address doesnt have a number", function() {
				scope.order.withdraw = false;
				scope.order.address = {number: null};

				var result = scope.isFinishValid();

				expect(result).toBe(false);
			});

			it("should return true if it's going to be withdraw", function() {
				scope.order.withdraw = true;
				var result = scope.isFinishValid();

				expect(result).toBe(true);
			});

			it("should return false the phone is not informed", function() {
				scope.order.phone = null;
				var result = scope.isFinishValid();

				expect(result).toBe(false);
			});

			it("should return false the payment method is not selected", function() {
				scope.order.paymentMethod = null;
				var result = scope.isFinishValid();

				expect(result).toBe(false);
			});
		});

		describe("when getting the error message", function() {
			beforeEach(function() {
				scope.order = {
					withdraw: false,
					address: {number: "464"},
					phone: "94567855",
					paymentMethod: {name: "Dinheiro"}
				};

				scope.addressStatus.zipCodeValid = true;
				scope.addressStatus.addressValid = true;

				scope.addressStatus.zipCodeChecked = true;
				scope.addressStatus.addressChecked = true;

				scope.addressStatus.addressAttended = true;
			});

			it("should be blank if the order is not going to be withdraw, the address is informed and attended, the phone is informed and the payment method is selected", function() {
				var result = scope.getErrorMessage();
				expect(result).toEqual("");
			});

			it("should be blank if the order is going to be withdraw, the phone is informed and the payment method is selected", function() {
				scope.order.withdraw = true;
				scope.address = null;

				var result = scope.getErrorMessage();
				expect(result).toEqual("");
			});

			it("should reclaim about the invalid or not filled address", function() {
				scope.order.address = null;
				scope.addressStatus.zipCodeValid = false;
				scope.addressStatus.addressValid = false;

				var result = scope.getErrorMessage();
				expect(result.length > 0).toBe(true);
			});

			it("should reclaim about the address not being attended by the establishment", function() {
				scope.addressStatus.addressChecked = false;
				scope.addressStatus.addressAttended = false;

				var result = scope.getErrorMessage();
				expect(result.length > 0).toBe(true);

				scope.addressStatus.zipCodeChecked = false;
				scope.addressStatus.addressChecked = true;

				result = scope.getErrorMessage();
				expect(result.length > 0).toBe(true);
			});

			it("should reclaim about the address number not informed", function() {
				scope.order.address.number = null;

				var result = scope.getErrorMessage();
				expect(result.length > 0).toBe(true);
			});

			it("should reclaim about the phone not informed", function() {
				scope.order.phone = null;

				var result = scope.getErrorMessage();
				expect(result.length > 0).toBe(true);
			});

			it("should reclaim about the payment method not selected", function() {
				scope.order.paymentMethod = null;

				var result = scope.getErrorMessage();
				expect(result.length > 0).toBe(true);
			});
		});

		describe("when finishing the order", function() {
			var isFinishValidCalled;

			beforeEach(function() {
				isFinishValidCalled = false;

				scope.isFinishValid = function() {
					isFinishValidCalled = true;
					return true;
				};
			});

			it("should check if the order is valid", function() {
				scope.finishOrder();
				expect(isFinishValidCalled).toBe(true);
			});

			it("should set the processingOrder to true and the errorProcessingOrder to false", function() {
				MockedOrderService.create = function() {
					return {then: function() {}};
				};

				scope.errorProcessingOrder = true;
				scope.processingOrder = false;

				scope.finishOrder();
				expect(scope.processingOrder).toBe(true);
				expect(scope.errorProcessingOrder).toBe(false);
			});

			it("should create the order on the service", function() {
				scope.finishOrder();
				expect(MockedOrderService._createCalled).toBe(true);
			});

			it("should create pass the order as parameter to the service", function() {
				scope.order = {items: [], withdraw: true};

				scope.finishOrder();
				expect(MockedOrderService._createOrder).toEqual(scope.order);
			});

			it("should set the processingOrder to false after created", function() {
				scope.order = {items: [], withdraw: true};

				scope.finishOrder();
				expect(scope.processingOrder).toBe(false);

				MockedOrderService._createSuccess = false;
				scope.finishOrder();
				expect(scope.processingOrder).toBe(false);
			});

			it("should show an error if not created", function() {
				scope.order = {items: [], withdraw: true};
				MockedOrderService._createSuccess = false;
				scope.finishOrder();

				expect(scope.errorProcessingOrder).toBe(true);
			});

			it("should send to the order tracking page", function() {
				scope.order = {items: [], withdraw: true};
				scope.finishOrder();

				expect(Mocked$location._currentPath).toEqual("/user/orders/");
			});
		});
	});
});