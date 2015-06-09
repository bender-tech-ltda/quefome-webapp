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

				$httpBackend.whenPOST("/api/user/orders/", order).respond(200, order);

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
				$httpBackend.whenPOST("/api/user/orders/", order).respond(200, order);

				OrderService.create(order);
				$httpBackend.flush();

				expect(Mocked$localStorage._lastRemovedKey).toBe("OrderService_store_-42");
			});
		});

		describe("when listing the orders", function() {
			it("should GET the list", function() {
				var orders = [];
				$httpBackend.whenGET("/api/user/orders/").respond(200, orders);

				var success = false;
				var responseOrders = null;
				OrderService.list().then(function(orders) {
					success = true;
					responseOrders = orders;
				});

				$httpBackend.flush();

				expect(success).toBe(true);
				expect(responseOrders).toEqual(orders);
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

			it("should retrieve the stored if updated one hour ago", function() {
				Mocked$localStorage._returnSettedValue = {
					__localStorageObject: true,
					updated: new Date(),
					value: {establishment: {id: -3}, product: {id: -4}}
				};

				var order = OrderService.retrieve({id: -10});
				expect(order).toEqual(Mocked$localStorage._returnSettedValue.value);
			});

			it("should not retrieve the stored if updated more than hour ago", function() {
				Mocked$localStorage._returnSettedValue = {
					__localStorageObject: true,
					updated: new Date(),
					value: {establishment: {id: -3}, product: {id: -4}}
				};

				var today = new Date();
				var hours = (2 * 1000 * 60 * 60); //2 horas
				Mocked$localStorage._returnSettedValue.updated.setTime(today.getTime() - hours)

				var order = OrderService.retrieve({id: -10});
				expect(order).toBe(false);
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

			it("should use the product selected flavors price based on the product flavor billing type", function() {
				order.items.push({
					product: {billingType: "SUM"},
					flavors: [{price: 2.72}, {price: 1.50}] //4.22
				}, {
					product: {billingType: "HIGHEST_PRICE"},
					flavors: [{price: 9.95}, {price: 5.50}] //9.95
				}, {
					product: {billingType: "AVERAGE_PRICE"},
					flavors: [{price: 5.95}, {price: 3.50}] //4.72
				});

				var result = OrderService.getOrderPrice(order);
				expect(result).toEqual(18.895);
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

			it("should accept a second parameter to add or not the deliverTax", function() {
				order.establishment = {
					parameters: {deliverTax: 2.0}
				};

				order.items = [{product: {price: 4.50}}];

				var result = OrderService.getOrderPrice(order, false);
				expect(result).toEqual(order.items[0].product.price);

				result = OrderService.getOrderPrice(order, true);
				expect(result).toEqual(order.items[0].product.price + order.establishment.parameters.deliverTax);

				result = OrderService.getOrderPrice(order);
				expect(result).toEqual(order.items[0].product.price + order.establishment.parameters.deliverTax);
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

			it("should use the product selected flavors price based on the product flavor billing type", function() {
				orderItem.flavors = [{price: 2.72}, {price: 3.70}, {}];

				orderItem.product = {billingType: "SUM"};
				var result = OrderService.getOrderItemPrice(orderItem);
				expect(result).toEqual(6.42);

				orderItem.product = {billingType: "HIGHEST_PRICE"};
				result = OrderService.getOrderItemPrice(orderItem);
				expect(result).toEqual(3.70);

				orderItem.product = {billingType: "AVERAGE_PRICE"};
				result = OrderService.getOrderItemPrice(orderItem);
				expect(result).toEqual(2.14);

				orderItem.product = {};
				var result = OrderService.getOrderItemPrice(orderItem);
				expect(result).toEqual(6.42);
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