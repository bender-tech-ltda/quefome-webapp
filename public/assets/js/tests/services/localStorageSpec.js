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

				$localStorage.set("key", "value");
				serializedValue = JSON.stringify("value");
				expect(MockedLocalStorage._lastSettedValue).toEqual(serializedValue);

				var object = {name: "Teste", number: 1, bla: true};
				$localStorage.set("key", object);
				serializedValue = JSON.stringify(object);
				expect(MockedLocalStorage._lastSettedValue).toEqual(serializedValue);

				$localStorage.set("key", 10);
				serializedValue = JSON.stringify(10);
				expect(MockedLocalStorage._lastSettedValue).toEqual(serializedValue);

				$localStorage.set("key", true);
				serializedValue = JSON.stringify(true);
				expect(MockedLocalStorage._lastSettedValue).toEqual(serializedValue);
			});
		});

		describe("when getting items", function() {
			it("should get the property using the key", function() {
				$localStorage.get("key");
				expect(MockedLocalStorage._lastGettedKey).toEqual("key");
			});

			it("should get the deserialized value", function() {
				MockedLocalStorage._returnGettedItem = JSON.stringify("value");
				var value = $localStorage.get("key");
				expect(value).toEqual("value");

				var object = {name: "Teste", number: 1, bla: true};
				MockedLocalStorage._returnGettedItem = JSON.stringify(object);
				var value = $localStorage.get("key");
				expect(value).toEqual(object);

				MockedLocalStorage._returnGettedItem = JSON.stringify(10);
				var value = $localStorage.get("key");
				expect(value).toEqual(10);

				MockedLocalStorage._returnGettedItem = JSON.stringify(false);
				var value = $localStorage.get("key");
				expect(value).toEqual(false);
			});
		});
	});
});