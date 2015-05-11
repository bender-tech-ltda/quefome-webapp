"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("OrderService", function() {
		var $httpBackend;
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
				},

				_lastRemovedKey: null,
				remove: function(key) {
					this._lastRemovedKey = key;
				}
			};

			module(function($provide) {
				$provide.value("$localStorage", Mocked$localStorage);
			});
		});

		beforeEach(inject(function(_OrderService_, _$httpBackend_) {
			OrderService = _OrderService_;
			$httpBackend = _$httpBackend_;
		}));

		describe("when creating an order", function() {
			it("should create an order", function() {
				var order = {items: [{product: {name: "Xis Cebola"}}]};

				$httpBackend.whenPOST("/api/orders/", order).respond(200, order);

				var success = false;
				var responseOrder = null;
				OrderService.create(order).then(function(createdOrder) {
					success = true;
					responseOrder = createdOrder;
				});

				$httpBackend.flush();

				expect(success).toBe(true);
				expect(responseOrder).toEqual(order);
			});

			it("should remove the order from storage", function() {
				var order = {establishment: {id: -42}};
				$httpBackend.whenPOST("/api/orders/", order).respond(200, order);

				OrderService.create(order);
				$httpBackend.flush();

				expect(Mocked$localStorage._lastRemovedKey).toBe("OrderService_store_-42");
			});
		});

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

		describe("when removing an order", function() {
			it("should remove using the order establishment", function() {
				var order = {establishment: {id: -2}};
				OrderService.remove(order);

				expect(Mocked$localStorage._lastRemovedKey).toEqual("OrderService_store_-2");
			});
		});

		describe("when calculating the order price", function() {
			var order;

			beforeEach(function() {
				order = {
					items: []
				};
			});

			it("should use the product price from each item", function() {
				order.items.push({
					product: {price: 5.50}
				}, {
					product: {price: 12.33}
				});

				var result = OrderService.getOrderPrice(order);
				expect(result).toEqual(order.items[0].product.price + order.items[1].product.price);
			});

			it("should use the product selected flavors price from each item", function() {
				order.items.push({
					flavors: [{price: 2.72}]
				}, {
					flavors: [{price: 9.95}]
				});

				var result = OrderService.getOrderPrice(order);
				expect(result).toEqual(order.items[0].flavors[0].price + order.items[1].flavors[0].price);
			});

			it("should use the product selected components from each item", function() {
				order.items.push({
					components: [{value: true, component: {price: 2.72}}]
				}, {
					components: [{value: true, component: {price: 9.95}}]
				}, {
					components: [{value: false, component: {price: 10.0}}]
				});

				var result = OrderService.getOrderPrice(order);
				expect(result).toEqual(order.items[0].components[0].component.price + order.items[1].components[0].component.price);
			});

			it("should use the product selected components options from each item", function() {
				order.items.push({
					components: [{selectedOption: {price: 2.0}}]
				}, {
					components: [{selectedOption: {price: 3.50}}]
				}, {
					components: [{selectedOption: {}}]
				});

				var result = OrderService.getOrderPrice(order);
				expect(result).toEqual(order.items[0].components[0].selectedOption.price + order.items[1].components[0].selectedOption.price);
			});

			it("it should use the product quantity from each item", function() {
				order.items.push({
					quantity: 10,
					product: {price: 5.60},
					flavors: [{price: 2.72}],
					components: [{value: true, component: {price: 2.72}}]
				}, {
					quantity: 2,
					product: {price: 10.50},
					components: [{selectedOption: {price: 3.50}}]
				});

				var item1Price = order.items[0].product.price + order.items[0].flavors[0].price;
				item1Price += order.items[0].components[0].component.price;
				item1Price *= order.items[0].quantity;

				var item2Price = order.items[1].product.price + order.items[1].components[0].selectedOption.price;
				item2Price *= order.items[1].quantity;

				var result = OrderService.getOrderPrice(order);
				expect(result).toEqual(item1Price + item2Price);		
			});

			it("should check if the order is not going to be withdraw and sum the establishment delivery tax", function() {
				order.withdraw = false;
				order.establishment = {
					parameters: {deliverTax: 2.0}
				};

				order.items = [{product: {price: 4.50}}];

				var result = OrderService.getOrderPrice(order);
				expect(result).toEqual(order.establishment.parameters.deliverTax + order.items[0].product.price);
			});
		});

		describe("when calculating the order item price", function() {
			var orderItem;

			beforeEach(function() {
				orderItem = {};
			});

			it("should use the product price", function() {
				orderItem.product = {price: 5.50};

				var result = OrderService.getOrderItemPrice(orderItem);
				expect(result).toEqual(orderItem.product.price);
			});

			it("should use the product selected flavors price", function() {
				orderItem.flavors = [{price: 2.72}, {price: 3.70}, {}];

				var result = OrderService.getOrderItemPrice(orderItem);
				expect(result).toEqual(orderItem.flavors[0].price + orderItem.flavors[1].price);
			});

			it("should use the product selected components from each item", function() {
				orderItem.components = [
					{value: true, component: {price: 2.72}},
					{value: true, component: {price: 3.37}}
				];

				var result = OrderService.getOrderItemPrice(orderItem);
				expect(result).toEqual(orderItem.components[0].component.price + orderItem.components[1].component.price);
			});

			it("should use the product selected components options from each item", function() {
				orderItem.components = [
					{selectedOption: {price: 2.0}},
					{selectedOption: {price: 3.50}}
				];

				var result = OrderService.getOrderItemPrice(orderItem);
				expect(result).toEqual(orderItem.components[0].selectedOption.price + orderItem.components[1].selectedOption.price);
			});

			it("it should use the product quantity from each item", function() {
				orderItem.quantity = 7;
				orderItem.product = {price: 5.00};
				orderItem.flavors = [
					{price: 2.50}
				];
				orderItem.components = [
					{selectedOption: {price: 3.50}}
				];

				var itemPrice = orderItem.product.price + orderItem.flavors[0].price;
				itemPrice += orderItem.components[0].selectedOption.price;
				itemPrice *= orderItem.quantity;

				var result = OrderService.getOrderItemPrice(orderItem);
				expect(result).toEqual(itemPrice);
			});
		});
	});
});