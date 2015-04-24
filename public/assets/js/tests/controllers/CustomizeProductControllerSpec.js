"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("CustomizeProductController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			var params = {};

			return injectController("CustomizeProductController", false, params, function($scope) {
				scope = $scope;
			});
		});

		it("should have a product property", function() {
			expect(scope.product).toBeDefined();
		});

		it("should have a componentCategories property", function() {
			expect(scope.componentCategories).toBeDefined();
		});

		it("should have a quantity property", function() {
			expect(scope.quantity).toBeDefined();
		});

		describe("when listining for $dialogParameters", function() {
			it("should listen for a product", function() {
				var params = {
					product: {id: 1, name: "Xis do Demo"}
				};

				scope.$broadcast("$dialogParameters", params);
				expect(scope.product).toEqual(params.product);
			});

			it("should listen for a product", function() {
				var called = false;
				var calledProduct = null;

				scope.groupProductComponents = function(product) {
					called = true;
					calledProduct = product;
				};

				var params = {
					product: {id: 1, name: "Xis do Demo"}
				};

				scope.$broadcast("$dialogParameters", params);

				expect(called).toBe(true);
				expect(calledProduct).toEqual(params.product);
			});
		});

		describe("when groupping the product components", function() {
			var product = null;

			beforeEach(function() {
				product = {
					id: -2,
					name: "Teste"
				};
			});

			it("should group by category", function() {
				product.components = [
					{name: "Fritas", category: "Adicionais"},
					{name: "Ovo", category: "Adicionais"},
					{name: "Ervilha", category: "Opcinais"},
					{name: "Milho", category: "Opcinais"}
				];

				scope.groupProductComponents(product);
				expect(scope.componentCategories.length).toEqual(2);
				expect(scope.componentCategories[0].name).toEqual(product.components[0].category);
				expect(scope.componentCategories[1].name).toEqual(product.components[2].category);
			});

			it("should group by optins", function() {
				product.components = [
					{name: "Borda", options: [{name: "Opção 1"}]},
					{name: "Recheio", options: [{name: "Opção 2"}]}
				];

				scope.groupProductComponents(product);
				expect(scope.componentCategories.length).toEqual(2);
				expect(scope.componentCategories[0].name).toEqual(product.components[0].name);
				expect(scope.componentCategories[1].name).toEqual(product.components[1].name);
			});

			it("should set to null if the product has no components", function() {
				scope.groupProductComponents(product);
				expect(scope.componentCategories).toBeNull();
			});

			it("should set the value property with the defaultValue property", function() {
				product.components = [
					{name: "Fritas", category: "Teste", defaultValue: true}
				];

				scope.groupProductComponents(product);
				expect(product.components[0].value).toEqual(product.components[0].defaultValue);
			});

			it("should set the option property with the defaultOption", function() {
				product.components = [
					{name: "Fritas", options: [{name: "Teste", defaultOption: true}]}
				];

				scope.groupProductComponents(product);
				expect(product.components[0].option).toEqual(product.components[0].options[0]);
			});
		});

		describe("when calculating the total value", function() {
			beforeEach(function() {
				scope.product = {
					id: -2,
					name: "Teste"
				};
			});

			it("should use the product price", function() {
				scope.product.price = 10;

				var result = scope.calculateTotalPrice();
				expect(result).toEqual(scope.product.price);
			});

			it("should use the selected components", function() {
				scope.product.components = [
					{value: true, price: 2.50},
					{value: true, price: 3.0}
				];

				var result = scope.calculateTotalPrice();
				expect(result).toEqual(scope.product.components[0].price + scope.product.components[1].price);
			});

			it("should use the default selected components", function() {
				scope.product.components = [
					{defaultValue: true, price: 2.50},
					{defaultValue: true, price: 3.0},
					{defaultValue: true}
				];

				var result = scope.calculateTotalPrice();
				expect(result).toEqual(scope.product.components[0].price + scope.product.components[1].price);
			});

			it("should use the selected components over the default selected components", function() {
				scope.product.components = [
					{value: false, defaultValue: true, price: 2.50},
					{value: true, defaultValue: false, price: 3.0}
				];

				var result = scope.calculateTotalPrice();
				expect(result).toEqual(scope.product.components[1].price);
			});

			it("should use the selected option", function() {
				scope.product.components = [
					{option: {price: 2.0}},
					{option: {price: 3.5}},
					{option: {}},
				];

				var result = scope.calculateTotalPrice();
				expect(result).toEqual(scope.product.components[0].option.price + scope.product.components[1].option.price);
			});

			it("should use the default selected option", function() {
				scope.product.components = [
					{defaultOption: {price: 3.0}},
					{defaultOption: {price: 1.5}}
				];

				var result = scope.calculateTotalPrice();
				expect(result).toEqual(scope.product.components[0].defaultOption.price + scope.product.components[1].defaultOption.price);
			});

			it("should use the selected option over the default selected option", function() {
				scope.product.components = [
					{option: {price: 2.0}, defaultOption: {price: 3.0}},
					{option: {price: 1.5}, defaultOption: {price: 1.5}}
				];

				var result = scope.calculateTotalPrice();
				expect(result).toEqual(scope.product.components[0].option.price + scope.product.components[1].option.price);
			});

			it("should be multiplied by the quantity", function() {
				scope.quantity = 3;
				scope.product.price = 10.0;

				scope.product.components = [
					{value: true, price: 2.50},
					{option: {price: 1.5}}
				];

				var result = scope.calculateTotalPrice();
				var expectedResult = scope.quantity * (scope.product.price + scope.product.components[0].price + scope.product.components[1].option.price);

				expect(result).toEqual(expectedResult);
			});

			it("should be 0 if the quantity is less or equal to 0", function() {
				scope.quantity = 0;
				scope.product.price = 10;
				
				var result = scope.calculateTotalPrice();
				expect(result).toEqual(0);
			});
		});

		describe("when creating order item", function() {
			beforeEach(function() {
				scope.product = {
					id: -2,
					name: "Pudim"
				};

				scope.$dialog = {
					hide: function() {}
				};
			});

			it("it should use the current product", function() {
				var orderItem = scope.createOrderItem();
				expect(orderItem.product).toEqual(scope.product);
			});

			it("should use the current product components", function() {
				scope.product.components = [
					{name: "Cebola"},
					{name: "Borda", options: [{name: "Sem borda"}, {name: "Borda de Chocolate"}]}
				];

				var orderItem = scope.createOrderItem();

				expect(orderItem.components[0].component).toEqual(scope.product.components[0]);
				expect(orderItem.components[1].component).toEqual(scope.product.components[1]);
			});

			it("should use the selected quantity", function() {
				scope.quantity = 10;

				var orderItem = scope.createOrderItem();
				expect(orderItem.quantity).toEqual(scope.quantity);
			});

			it("should have a property with the total cost", function() {
				scope.quantity = 2;
				scope.product.price = 10.0;
				scope.product.components = [
					{value: true, price: 2.50},
					{option: {price: 1.5}}
				];

				var orderItem = scope.createOrderItem();
				
				var totalPrice = scope.quantity * (scope.product.price + scope.product.components[0].price + scope.product.components[1].option.price);
				expect(orderItem.price).toEqual(totalPrice);
			});

			it("should hide the current dialog", function() {
				var hideCalled = false;

				scope.$dialog = {
					hide: function() {
						hideCalled = true;
					}
				};

				scope.createOrderItem();
				expect(hideCalled).toBe(true);
			});

			it("should pass the orderItem as parameter to the dialog hide function", function() {
				var sentOrderItem = null;

				scope.$dialog = {
					hide: function(orderItem) {
						sentOrderItem = orderItem;
					}
				};

				var expectedOrderItem = scope.createOrderItem();
				expect(sentOrderItem).toEqual(expectedOrderItem);
			});
		});
	});
});