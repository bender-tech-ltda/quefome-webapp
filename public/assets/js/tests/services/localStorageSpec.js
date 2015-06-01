"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("$localStorage", function() {
		var $localStorage;
		var MockedLocalStorage;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_$localStorage_) {
			$localStorage = _$localStorage_;
		}));

		beforeEach(function() {
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
			it("should store using the passed key", function() {
				$localStorage.set("key", "value");
				expect(MockedLocalStorage._lastSettedKey).toEqual("key");
			});

			it("should store the passed value serialized", function() {
				var serializedValue;

				var object = {name: "Teste", number: 1, bla: true};
				$localStorage.set("key", object);
				expect(typeof(MockedLocalStorage._lastSettedValue)).toEqual("string");
			});

			it("should wrap value in an object with a date property", function() {
				var serializedValue;

				$localStorage.set("key", "teste");
				var result = JSON.parse(MockedLocalStorage._lastSettedValue);

				expect(result.__localStorageObject).toBe(true);
				expect(result.created).toBeDefined();
				expect(result.updated).toBeDefined();
				expect(result.value).toEqual("teste");
			});
		});

		describe("when getting items", function() {
			it("should get the property using the key", function() {
				$localStorage.get("key");
				expect(MockedLocalStorage._lastGettedKey).toEqual("key");
			});

			it("should get the deserialized value", function() {
				var object = {value: {name: "Teste", number: 1, bla: true}};
				MockedLocalStorage._returnGettedItem = JSON.stringify(object);
				var value = $localStorage.get("key");
				expect(value).toEqual(object);
			});

			it("should parse the localStorageObject", function() {
				var object = {__localStorageObject: true, created: new Date(), updated: new Date(), value: "teste"};
				MockedLocalStorage._returnGettedItem = JSON.stringify(object);
				var value = $localStorage.get("key");

				expect(value.created instanceof Date).toBe(true);
				expect(value.updated instanceof Date).toBe(true);
			});
		});

		describe("when removing items", function() {
			it("should remove based on the key", function() {
				$localStorage.remove("key");
				expect(MockedLocalStorage._lastRemovedKey).toEqual("key");
			});
		});
	});
});