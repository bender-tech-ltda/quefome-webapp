"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("CheckAddressController", function() {
		var scope, controller;
		var MockedAddressService, MockedEstablishmentService;
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

				_address: {},
				setCurrentAddress: function(address) {
					this._address = address;
				},
				getCurrentAddress: function() {
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
				$location: Mocked$location
			};

			return injectController("CheckAddressController", "views/partials/establishments/check-address.html", params, function($scope) {
				scope = $scope;
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

		it("should listen for a establishment as $dialogParameters", function() {
			var params = {
				establishment: {id: 1, name: "Blabla"}
			};

			scope.$broadcast("$dialogParameters", params);
			expect(scope.establishment).toEqual(params.establishment);
		});

		describe("when checking for the zip code", function() {
			it("should search for the zip code address", function() {
				scope.zipCode = "93336220";
				scope.$digest();

				scope.checkZipCode();
				expect(MockedAddressService._searchZipCodeCalled).toBe(true);
			});

			it("should check if the establishment is attending the seached address", function() {
				scope.zipCode = "93336220";
				scope.$digest();

				scope.checkZipCode();
				expect(MockedEstablishmentService._isAttendingCalled).toBe(true);
			});

			it("should set the addressChecked to true", function() {
				scope.zipCode = "93336220";
				scope.$digest();

				scope.checkZipCode();

				expect(scope.addressChecked).toBe(true);
			});

			it("should not check if the zipCode is invalid", function() {
				scope.zipCode = "";
				scope.$digest();

				scope.checkZipCode();

				expect(MockedAddressService._searchZipCodeCalled).toBe(false);

				scope.zipCode = "abc123";
				scope.checkZipCode();
				
				expect(MockedAddressService._searchZipCodeCalled).toBe(false);
			});

			it("should set the addressAttended to true if the establishment attend the user zip code", function() {
				scope.zipCode = "93336220";
				scope.$digest();

				MockedEstablishmentService.attendedZipCode = scope.zipCode;

				scope.checkZipCode();

				expect(scope.addressAttended).toBe(true);
			});

			it("should set the addressChecked to true event if the establishment doesn't attend that address", function() {
				scope.zipCode = "95677229";
				scope.$digest();

				scope.checkZipCode();

				expect(scope.addressChecked).toBe(true);
			});

			it("should set the processing to true", function() {
				MockedEstablishmentService.isAttendingAddress = function() {
					return {then: function() {}};
				};

				scope.zipCode = "93336220";
				scope.$digest();

				scope.checkZipCode();
				expect(scope.processing).toBe(true);
			});

			it("should set the processing to false after finish", function() {
				scope.checkZipCode();
				expect(scope.processing).toBe(false);
			});
		});

		describe("when skipping the address verification", function() {
			it("should set the address as skipped on the AddressService", function() {
				scope.skipAddressVerification();
				expect(MockedAddressService.getCurrentAddress().skipped).toBe(true);
			});

			it("should close the address check dialog", function() {
				var called = false;
				scope.$dialog = {
					hide: function() {
						called = true;
					}
				};

				scope.skipAddressVerification();
				expect(called).toBe(true);
			});

			it("should send to the establishment page", function() {
				scope.establishment = {url: "teste"};

				scope.$dialog = {
					hide: function(callback) {
						callback();
					}
				};

				scope.skipAddressVerification();
				expect(Mocked$location.path()).toEqual("/establishments/" + scope.establishment.url);
			});
		});
	});
});