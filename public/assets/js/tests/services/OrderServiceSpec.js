"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("OrderService", function() {
		var Mocked$localStorage, OrderService;

		beforeEach(module("qfServices"));

		beforeEach(function() {
			Mocked$localStorage = {
				_lastSettedKey: null,
				_lastSettedValue: null,
				set: function(key, value) {
					this._lastSettedKey = key;
					this._lastSettedValue = value;
				},

				_lastGettedKey: null,
				_returnSettedValue: null,
				get: function(key) {
					this._lastGettedKey = key;
					return this._returnSettedValue;
				}
			};

			module(function($provide) {
				$provide.value("$localStorage", Mocked$localStorage);
			});
		});

		beforeEach(inject(function(_OrderService_) {
			OrderService = _OrderService_;
		}));

		describe("when storing an order", function() {
			it("should store using the establishment as key", function() {
				OrderService.store({establishment: {id: -2}, product: {id: -10}});
				expect(Mocked$localStorage._lastSettedKey).toEqual("OrderService_store_-2");
			});

			it("should store the hole order", function() {
				var order = {establishment: {id: -2}, product: {id: -10}};

				OrderService.store(order);
				expect(Mocked$localStorage._lastSettedValue).toEqual(order);
			});
		});

		describe("when retriving an order", function() {
			it("should be retrivied using a establishment", function() {
				OrderService.retrieve({id: -21});
				expect(Mocked$localStorage._lastGettedKey).toEqual("OrderService_store_-21");
			});

			it("should retrieve the stored order", function() {
				Mocked$localStorage._returnSettedValue = {establishment: {id: -3}, product: {id: -4}};

				var order = OrderService.retrieve({id: -10});
				expect(order).toEqual(Mocked$localStorage._returnSettedValue);
			});
		});
	});
});