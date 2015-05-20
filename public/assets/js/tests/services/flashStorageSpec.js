"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("$flashStorage", function() {
		var $flashStorage;
		var MockedSessionStorage;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_$flashStorage_) {
			$flashStorage = _$flashStorage_;
		}));

		beforeEach(function() {
			MockedSessionStorage = {
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

			$flashStorage.__setSessionStorage(MockedSessionStorage);
		});

		describe("when storing items", function() {
			it("should store using the passed key", function() {
				$flashStorage.set("key", "value");
				expect(MockedSessionStorage._lastSettedKey).toEqual("key");
			});

			it("should store the passed value", function() {
				var serializedValue;

				$flashStorage.set("key", "value");
				expect(MockedSessionStorage._lastSettedValue).toEqual("value");

				var object = {name: "Teste", number: 1, bla: true};
				$flashStorage.set("key", object);
				expect(MockedSessionStorage._lastSettedValue).toEqual(object);

				$flashStorage.set("key", 10);
				expect(MockedSessionStorage._lastSettedValue).toEqual(10);

				$flashStorage.set("key", true);
				expect(MockedSessionStorage._lastSettedValue).toEqual(true);
			});
		});

		describe("when getting items", function() {
			it("should get the property using the key", function() {
				$flashStorage.get("key");
				expect(MockedSessionStorage._lastGettedKey).toEqual("key");
			});

			it("should get the value", function() {
				MockedSessionStorage._returnGettedItem = "value";
				var value = $flashStorage.get("key");
				expect(value).toEqual("value");

				var object = {name: "Teste", number: 1, bla: true};
				MockedSessionStorage._returnGettedItem = object;
				var value = $flashStorage.get("key");
				expect(value).toEqual(object);

				MockedSessionStorage._returnGettedItem = 10;
				var value = $flashStorage.get("key");
				expect(value).toEqual(10);

				MockedSessionStorage._returnGettedItem = false;
				var value = $flashStorage.get("key");
				expect(value).toEqual(false);
			});

			it("should remove the items after get", function() {
				MockedSessionStorage._lastRemovedKey = "";
				var value = $flashStorage.get("key");
				expect(MockedSessionStorage._lastRemovedKey).toEqual("key");
			});

			it("should not remove the items if second parameter is true", function() {
				MockedSessionStorage._lastRemovedKey = "";
				var value = $flashStorage.get("key", true);
				expect(MockedSessionStorage._lastRemovedKey).toEqual("");
			});
		});

		describe("when removing items", function() {
			it("should remove based on the key", function() {
				$flashStorage.remove("key");
				expect(MockedSessionStorage._lastRemovedKey).toEqual("key");
			});
		});
	});
});