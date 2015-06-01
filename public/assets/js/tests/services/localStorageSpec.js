"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("$localStorage", function() {
		var $localStorage;
		var MockedLocalStorage;

		var expectedDecryptoFunction, expectedEncryptoFunction;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_$localStorage_) {
			$localStorage = _$localStorage_;
		}));

		beforeEach(function() {
			expectedEncryptoFunction = function(value) {
				if (typeof(window.btoa) === "function") {
					return window.btoa(encodeURIComponent(JSON.stringify(value)));
				}

				return encodeURIComponent(JSON.stringify(value));
			};

			expectedDecryptoFunction = function(value) {
				if (typeof(window.atob) === "function") {
					return JSON.parse(decodeURIComponent(window.atob(value)));
				}

				return JSON.parse(decodeURIComponent(value));
			};

			MockedLocalStorage = {
				_lastSettedKey: null,
				_lastSettedValue: null,
				setItem: function(key, value) {
					this._lastSettedKey = key;
					this._lastSettedValue = value;
				},

				_lastGettedKey: null,
				_returnGettedItem: null,
				getItem: function(key) {
					this._lastGettedKey = key;
					return this._returnGettedItem;
				},

				_lastRemovedKey: null,
				removeItem: function(key) {
					this._lastRemovedKey = key;
				}
			};

			$localStorage.__setLocalStorage(MockedLocalStorage);
		});

		describe("when storing items", function() {
			it("should store using the passed key encrypted", function() {
				$localStorage.set("key", "value");

				var key = expectedDecryptoFunction(MockedLocalStorage._lastSettedKey);
				expect(key).toEqual("key");
			});

			it("should store the passed value serialized and encrypted", function() {
				var serializedValue;

				var object = {name: "Teste", number: 1, bla: true};
				$localStorage.set("key", object);

				var result = expectedDecryptoFunction(MockedLocalStorage._lastSettedValue);
				expect(typeof(result)).toEqual("object");
			});

			it("should wrap value in an object with a date property", function() {
				var serializedValue;

				$localStorage.set("key", "teste");
				var result = expectedDecryptoFunction(MockedLocalStorage._lastSettedValue);

				expect(result.__localStorageObject).toBe(true);
				expect(result.created).toBeDefined();
				expect(result.updated).toBeDefined();
				expect(result.value).toEqual("teste");
			});
		});

		describe("when getting items", function() {
			it("should get the property using the key", function() {
				$localStorage.get("key");

				var key = expectedDecryptoFunction(MockedLocalStorage._lastGettedKey);
				expect(key).toEqual("key");
			});

			it("should get the descrypt and deserialized value", function() {
				var object = {value: {name: "Teste", number: 1, bla: true}};
				MockedLocalStorage._returnGettedItem = expectedEncryptoFunction(object);

				var value = $localStorage.get("key");
				expect(value).toEqual(object);
			});

			it("should parse the localStorageObject", function() {
				var object = {__localStorageObject: true, created: new Date(), updated: new Date(), value: "teste"};
				MockedLocalStorage._returnGettedItem = expectedEncryptoFunction(object);
				var value = $localStorage.get("key");

				expect(value.created instanceof Date).toBe(true);
				expect(value.updated instanceof Date).toBe(true);
			});
		});

		describe("when removing items", function() {
			it("should remove based on the encrupted key", function() {
				$localStorage.remove("key");

				var key = expectedDecryptoFunction(MockedLocalStorage._lastRemovedKey);
				expect(key).toEqual("key");
			});
		});
	});
});