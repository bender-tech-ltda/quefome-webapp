"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("CheckAddressController", function() {
		var scope, controller;
		var MockedAddressService, MockedEstablishmentService, MockedOrderService;
		var Mocked$location;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			MockedAddressService = {
				_addresses: {
					"93336220": {address: "Rua Marechal Camara", neighborhood: "Ideal", zipCode: "93336220"}
				},
				_searchZipCodeCalled: false,
				searchZipCode: function(zipCode) {
					this._searchZipCodeCalled = true;
					var address = this._addresses[zipCode];
					return {
						then: function(callback) {
							callback(address);
						}
					};
				},

				_searchAddressCalled: false,
				searchAddress: function(address) {
					this._searchAddressCalled = true;
					address.zipCode = "93336220";

					return {
						then: function(callback) {
							callback(address);
						}
					};
				},

				_address: false,
				setCurrentAddress: function(address) {
					this._address = address;
				},
				_getCurrentAddressCaled: false,
				getCurrentAddress: function() {
					this._getCurrentAddressCaled = true;
					return this._address;
				}
			};

			MockedEstablishmentService = {
				attendedZipCode: "",
				_isAttendingCalled: false,
				isAttendingAddress: function(establishment, address) {
					if (!address) {
						address = {};
					}

					this._isAttendingCalled = true;
					var attend = address.zipCode == this.attendedZipCode;
					return {
						then: function(callback) {
							callback(attend);
						}
					};
				}
			};

			MockedOrderService = {
				_removeCalled: false,
				_removeOrder: null,
				remove: function(order) {
					this._removeCalled = true;
					this._removeOrder = order;
				}
			};

			Mocked$location = {
				_path: "",
				path: function(path) {
					if (path) {
						this._path = path;
					}

					return this._path;
				}
			};
		});

		beforeEach(function() {
			var params = {
				AddressService: MockedAddressService,
				EstablishmentService: MockedEstablishmentService,
				OrderService: MockedOrderService,
				$location: Mocked$location
			};

			return injectController("CheckAddressController", "views/partials/establishments/check-address.html", params, function($scope) {
				scope = $scope;
				scope.$dialog = {
					_beforeHideCallback: function() {},
					beforeHide: function(callback) {
						if (callback) {
							this._beforeHideCallback = callback;
						}
					},

					_calledHide: false,
					_hideParams: null,
					hide: function(params) {
						this._calledHide = true;
						this._hideParams = params;
						this._beforeHideCallback();
					}
				};
			});
		});

		it("should have a zipCode property", function() {
			expect(scope.zipCode).toBeDefined();
		});

		it("should have a address property", function() {
			expect(scope.zipCode).toBeDefined();
		});

		it("should have a establishment property", function() {
			expect(scope.establishment).toBeDefined();
		});

		it("should have a addressChecked property", function() {
			expect(scope.addressChecked).toBeDefined();
		});

		it("should have a addressAttended property", function() {
			expect(scope.addressAttended).toBeDefined();
		});

		it("should have a processing property", function() {
			expect(scope.processing).toBeDefined();
		});

		it("should have a isZipCodeFormVisible property", function() {
			expect(scope.isZipCodeFormVisible).toBeDefined();
		});

		it("should have a invalidZipCode property", function() {
			expect(scope.invalidZipCode).toBeDefined();
		});

		it("should have a invalidAddress property", function() {
			expect(scope.invalidAddress).toBeDefined();
		});

		it("should check if the user already informed an address before", function() {
			expect(MockedAddressService._getCurrentAddressCaled).toBe(true);
		});

		it("should listen for a establishment as $dialogParameters", function() {
			var params = {
				establishment: {id: 1, name: "Blabla"}
			};

			scope.$broadcast("$dialogParameters", params);
			expect(scope.establishment).toEqual(params.establishment);
		});

		describe("when checking for the zip code", function() {
			beforeEach(function() {
				scope.zipCode = "93336220";
				scope.$digest();
			});

			it("should search for the zip code address", function() {
				scope.checkZipCode();
				expect(MockedAddressService._searchZipCodeCalled).toBe(true);
			});

			it("should check if the establishment is attending the seached address", function() {
				scope.checkZipCode();
				expect(MockedEstablishmentService._isAttendingCalled).toBe(true);
			});

			it("should set the addressChecked to true", function() {
				scope.checkZipCode();
				expect(scope.addressChecked).toBe(true);
			});

			it("should validate if the zipCode is invalid", function() {
				scope.zipCode = "";
				scope.$digest();

				scope.checkZipCode();
				expect(MockedAddressService._searchZipCodeCalled).toBe(false);

				scope.zipCode = "abc123";
				scope.$digest();

				scope.checkZipCode();
				expect(MockedAddressService._searchZipCodeCalled).toBe(false);
			});

			it("should set the addressAttended to true if the establishment attend the user zip code", function() {
				MockedEstablishmentService.attendedZipCode = scope.zipCode;

				scope.checkZipCode();
				expect(scope.addressAttended).toBe(true);
			});

			it("should close the dialog if the zip code is attended", function() {
				MockedEstablishmentService.attendedZipCode = scope.zipCode;

				scope.checkZipCode();
				expect(scope.$dialog._calledHide).toBe(true);
			});

			it("should set the addressChecked to true even if the establishment doesn't attend that zip code", function() {
				scope.zipCode = "95677229";
				scope.$digest();

				scope.checkZipCode();
				expect(scope.addressChecked).toBe(true);
			});

			it("should set the processing to true", function() {
				MockedEstablishmentService.isAttendingAddress = function() {
					return {then: function() {}};
				};

				scope.checkZipCode();
				expect(scope.processing).toBe(true);
			});

			it("should set the processing to false after finish", function() {
				scope.checkZipCode();
				expect(scope.processing).toBe(false);
			});

			it("should set the user current address", function() {
				MockedEstablishmentService.attendedZipCode = scope.zipCode;

				scope.checkZipCode();
				expect(MockedAddressService.getCurrentAddress()).toEqual(MockedAddressService._addresses[scope.zipCode]);
			});

			it("should set the invalidZipCode to false if the zipCode is valid", function() {
				scope.invalidZipCode = true;

				scope.checkZipCode();
				expect(scope.invalidZipCode).toBe(false);
			});

			it("should set the invalidZipCode to true if the zipCode is invalid", function() {
				MockedAddressService.searchZipCode = function() {
					return {
						then: function(successCallback, failCallback) {
							failCallback();
						}
					};
				};

				scope.checkZipCode();
				expect(scope.invalidZipCode).toBe(true);
			});
		});

		describe("when checking for the address", function() {
			beforeEach(function() {
				scope.address = {address: "Rua B", city: "Porto Alegre", state: "RS"};
				scope.$digest();
			});

			it("should search for the address", function() {
				scope.checkAddress();
				expect(MockedAddressService._searchAddressCalled).toBe(true);
			});

			it("should check if the establishment is attending the searched address", function() {
				scope.checkAddress();
				expect(MockedEstablishmentService._isAttendingCalled).toBe(true);
			});

			it("should set the addressChecked to true", function() {
				scope.checkAddress();
				expect(scope.addressChecked).toBe(true);
			});

			it("should validate if the zipCode is invalid", function() {
				scope.address.address = "";
				scope.$digest();

				scope.checkAddress();
				expect(MockedAddressService._searchZipCodeCalled).toBe(false);				
			});

			it("should set the addressAttended to true if the establishment attend the address", function() {
				MockedEstablishmentService.attendedZipCode = "93336220";

				scope.checkAddress();
				expect(scope.addressAttended).toBe(true);
			});

				it("should close the dialog if the address is attended", function() {
				MockedEstablishmentService.attendedZipCode = "93336220";

				scope.checkAddress();
				expect(scope.$dialog._calledHide).toBe(true);
			});

			it("should set the addressChecked to true even if the establishment doesn't attend that address", function() {
				MockedEstablishmentService.attendedZipCode = "95677229";

				scope.checkAddress();
				expect(scope.addressChecked).toBe(true);
			});

			it("should set the processing to true", function() {
				MockedEstablishmentService.isAttendingAddress = function() {
					return {then: function() {}};
				};

				scope.checkAddress();
				expect(scope.processing).toBe(true);
			});

			it("should set the processing to false after finish", function() {
				scope.checkAddress();
				expect(scope.processing).toBe(false);
			});

			it("should set the user current address", function() {
				scope.checkAddress();
				expect(MockedAddressService.getCurrentAddress()).toEqual(scope.address);
			});

			it("should set the invalidAddress to false if the zipCode is valid", function() {
				scope.invalidAddress = true;

				scope.checkAddress();
				expect(scope.invalidAddress).toBe(false);
			});

			it("should set the invalidAddress to true if the address is invalid", function() {
				MockedAddressService.searchAddress = function() {
					return {
						then: function(successCallback, failCallback) {
							failCallback();
						}
					};
				};

				scope.checkAddress();
				expect(scope.invalidAddress).toBe(true);
			});
		});

		describe("when showing the address form", function() {
			it("should set the isZipCodeFormVisible property to false", function() {
				scope.showAddressForm();
				expect(scope.isZipCodeFormVisible).toBe(false);
			});

			it("should clear the zipCode property", function() {
				scope.address = {address: "Rua B"};

				scope.showAddressForm();
				expect(scope.address).toEqual({});
			});

			it("should set the invalidAddress property to false", function() {
				scope.invalidAddress = true;
				scope.showAddressForm();

				expect(scope.invalidAddress).toBe(false);
			});

			it("should set the addressForm.$submitted property to false", function() {
				scope.addressForm.$submitted = true;
				scope.showAddressForm();

				expect(scope.addressForm.$submitted).toBe(false);
			});
		});

		describe("when showing the zip code form", function() {
			it("should set the isZipCodeFormVisible property to true", function() {
				scope.showZipCodeForm();
				expect(scope.isZipCodeFormVisible).toBe(true);
			});

			it("should clear the address property", function() {
				scope.zipCode = "93336220";
				scope.showZipCodeForm();
				expect(scope.zipCode).toEqual("");
			});

			it("should set the invalidZipCode property to false", function() {
				scope.invalidZipCode = true;
				scope.showZipCodeForm();

				expect(scope.invalidZipCode).toBe(false);
			});

			it("should set the zipCodeForm.$submitted property to false", function() {
				scope.zipCodeForm.$submitted = true;
				scope.showZipCodeForm();

				expect(scope.zipCodeForm.$submitted).toBe(false);
			});
		});

		describe("when skipping the address verification", function() {
			it("should set the address as skipped on the AddressService", function() {
				scope.skipAddressVerification();
				expect(MockedAddressService.getCurrentAddress().skipped).toBe(true);
			});

			it("should close the address check dialog", function() {
				scope.skipAddressVerification();
				expect(scope.$dialog._calledHide).toBe(true);
			});
		});

		describe("going to establishment search", function() {
			it("should remove any stored order of the current establishment", function() {
				scope.goToEstablishmentSearch();

				expect(MockedOrderService._removeCalled).toBe(true);
				expect(MockedOrderService._removeOrder.establishment).toBe(scope.establishment);
			});

			it("should close the dialog", function() {
				scope.goToEstablishmentSearch();
				expect(scope.$dialog._calledHide).toBe(true);
			});

			it("should send to the establishment search page", function() {
				scope.goToEstablishmentSearch();
				expect(Mocked$location.path()).toEqual("/establishments/search/");
			});
		});

		describe("when closing the dialog", function() {
			it("should close the dialog", function() {
				scope.closeDialog();
				expect(scope.$dialog._calledHide).toBe(true);
			});

			it("should send a response", function() {
				scope.address = {address: "123"};
				scope.addressAttended = true;

				scope.closeDialog(false);

				expect(scope.$dialog._hideParams.address).toEqual(scope.address);
				expect(scope.$dialog._hideParams.isAttended).toBe(scope.addressAttended);
				expect(scope.$dialog._hideParams.skipped).toBe(false);
			});
		});
	});
});