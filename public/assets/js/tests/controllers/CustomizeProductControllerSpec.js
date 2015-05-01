"use strict";

define(["angular", "angular/mock", "quefome/controllers"], function(angular) {

	describe("CustomizeProductController", function() {
		var scope, controller;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			var params = {};

			return injectController("CustomizeProductController", "views/partials/products/customize.html", params, function($scope) {
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

		it("should have a instructions property", function() {
			expect(scope.instructions).toBeDefined();
		});

		it("should have a selectedFlavors property", function() {
			expect(scope.selectedFlavors).toBeDefined();
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

			it("should listen for a orderItem", function() {
				var params = {
					orderItem: {
						product: {id: 1, name: "Xis do Demo"}
					}
				};

				scope.$broadcast("$dialogParameters", params);
				expect(scope.product).toEqual(params.orderItem.product);			
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

			it("should use the selected flavors price", function() {
				scope.selectedFlavors = [
					{price: 2.10},
					{price: 3.55}
				];

				var result = scope.calculateTotalPrice();
				expect(result).toEqual(scope.selectedFlavors[0].price + scope.selectedFlavors[1].price);
			});

			it("should be multiplied by the quantity", function() {
				scope.quantity = 3;
				scope.product.price = 10.0;

				scope.product.components = [
					{value: true, price: 2.50},
					{option: {price: 1.5}}
				];

				scope.selectedFlavors = [
					{price: 2.05}
				];

				var result = scope.calculateTotalPrice();
				var expectedResult = scope.quantity * (scope.product.price + scope.product.components[0].price + scope.product.components[1].option.price + scope.selectedFlavors[0].price);

				expect(result).toEqual(expectedResult);
			});

			it("should be 0 if the quantity is less or equal to 0", function() {
				scope.quantity = 0;
				scope.product.price = 10;
				
				var result = scope.calculateTotalPrice();
				expect(result).toEqual(0);
			});
		});

		describe("when toggling a flavor", function() {
			it("should add the flavor to the selectedFlavors if it doesn't exists yet and the flavor is selected", function() {
				scope.selectedFlavors = [];
				var flavor = {id: -2, name: "Mussarela", selected: true};

				scope.toggleSelectedFlavor(flavor);
				expect(scope.selectedFlavors[0]).toEqual(flavor);
			});

			it("should remove the flavor if it already exists and the flavor is selected", function() {
				var flavor = {id: -2, name: "Mussarela", selected: false};
				scope.selectedFlavors = [flavor];

				scope.toggleSelectedFlavor(flavor);
				expect(scope.selectedFlavors.length).toEqual(0);
			});
		});

		describe("when checking if the flavor is disable", function() {
			it("should return false if the flavor is selected", function() {
				var result = scope.isFlavorDisabled({selected: true});
				expect(result).toBe(false);
			});

			it("should return false if the selectedFlavors.length is lower then the product flavors limit", function() {
				scope.product = {
					flavorsAmount: 1
				};

				scope.selectedFlavors = [];

				var result = scope.isFlavorDisabled({});
				expect(result).toBe(false);
			});

			it("should return true if the flavor is not selected and the selectedFlavors.length is higher or equal to then the product flavors limit", function() {
				scope.product = {
					flavorsAmount: 1,
				};

				scope.selectedFlavors = [{}];

				var result = scope.isFlavorDisabled({});
				expect(result).toBe(true);
			});
		});

		describe("when validating the order item", function() {
			it("should return false if the product has flavors e none flavor was selected", function() {
				scope.product = {
					flavors: [
						{id: -1, name: "Portuguesa"}
					]
				};

				scope.selectedFlavors = [];

				var result = scope.isOrderItemValid();
				expect(result).toBe(false);
			});

			it("should return false if the there is more selected flavors then the product flavor limit", function() {
				scope.product = {
					flavorsAmount: 1,
				};

				scope.selectedFlavors = [{}, {}];

				var result = scope.isOrderItemValid();
				expect(result).toBe(false);
			});

			it("should return false if quantity is null", function() {
				scope.quantity = null;
				scope.$digest();

				var result = scope.isOrderItemValid();
				expect(result).toBe(false);
			});

			it("should return false if quantity is lower then 1", function() {
				scope.quantity = 0;
				scope.$digest();

				var result = scope.isOrderItemValid();
				expect(result).toBe(false);
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

			it("should not create if the product has flavors e none flavor was selected", function() {
				scope.product = {
					flavors: [
						{id: -1, name: "Portuguesa"}
					]
				};

				scope.selectedFlavors = [];

				var result = scope.createOrderItem();
				expect(result).toBe(false);
			});

			it("should not create if the there is more selected flavors then the product flavor limit", function() {
				scope.product = {
					flavorsAmount: 1,
				};

				scope.selectedFlavors = [{}, {}];

				var result = scope.createOrderItem();
				expect(result).toBe(false);
			});

			it("should not create if quantity is invalid", function() {
				scope.quantity = null;
				scope.$digest();

				var result = scope.createOrderItem();
				expect(result).toBe(false);
			});

			it("should use the current product", function() {
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

			it("should use the selected flavors", function() {
				scope.selectedFlavors = [
					{id: -1, name: "Sardinha"},
					{id: -2, name: "Mussarela"}
				];

				var orderItem = scope.createOrderItem();
				expect(orderItem.flavors).toEqual(scope.selectedFlavors);
			});

			it("should use the instructions", function() {
				scope.instructions = "Blablablablabla";

				var orderItem = scope.createOrderItem();
				expect(orderItem.instructions).toEqual(scope.instructions);
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

		describe("when setting the current product", function() {
			it("should set the product property", function() {
				var product = {id: -2};
				scope.setCurrentProduct(product);

				expect(scope.product).toEqual(product);
			});

			it("should set the flavors selected property to false", function() {
				var product = {
					id: -2,
					flavors: [{}, {}]
				};

				scope.setCurrentProduct(product);

				expect(scope.product.flavors[0].selected).toBe(false);
				expect(scope.product.flavors[1].selected).toBe(false);
			});

			it("should call the groupProductComponents function", function() {
				var product = {
					id: -2
				};

				var called = false;
				var passedProduct = null;

				scope.groupProductComponents = function(product) {
					called = true;
					passedProduct = product;
				};

				scope.setCurrentProduct(product);

				expect(called).toBe(true);
				expect(passedProduct).toBe(product);
			});
		});

		describe("when extracting an order item", function() {
			var orderItem;

			beforeEach(function() {
				orderItem = {};
			});

			it("should use the order item product", function() {
				orderItem.product = {id: -1};
				scope.extractOrderItem(orderItem);

				expect(scope.product).toEqual(orderItem.product);
			});

			it("should use the order item product flavors", function() {
				var flavor = {id: -9, name: "Paprica"};

				orderItem.product = {id: -1, flavors: [flavor]};
				orderItem.flavors = [angular.copy(flavor)];

				scope.extractOrderItem(orderItem);
				expect(scope.product.flavors[0].selected).toBe(true);
				expect(scope.selectedFlavors[0]).toEqual(flavor);
			});

			it("should use the order item product selected component", function() {
				var itemComponent = {value: true, component: {id: -2}};

				orderItem.product = {id: -1, components: [itemComponent.component]};
				orderItem.components = [itemComponent];

				scope.extractOrderItem(orderItem);
				expect(scope.componentCategories[0].components[0].value).toEqual(true);
			});

			it("should use the order item product selected option", function() {
				var itemComponent = {selectedOption: {id: -7}, component: {id: -2, options: [{id: -7}]}};

				orderItem.product = {id: -1, components: [itemComponent.component]};
				orderItem.components = [itemComponent];

				scope.extractOrderItem(orderItem);
				expect(scope.componentCategories[0].components[0].option).toEqual(itemComponent.component.options[0]);
			});

			it("should use the order item quantity", function() {
				scope.extractOrderItem({product: {}, quantity: 10});
				expect(scope.quantity).toEqual(10);
			});

			it("should use the order item instructions", function() {
				orderItem.instructions = "teste";
				orderItem.product = {};

				scope.extractOrderItem(orderItem);
				expect(scope.instructions).toEqual(orderItem.instructions);
			});
		});

		describe("when closing the dialog", function() {
			it("should hide the current dialog", function() {
				var hideCalled = false;

				scope.$dialog = {
					hide: function() {
						hideCalled = true;
					}
				};

				scope.closeDialog();
				expect(hideCalled).toBe(true);
			});

			it("should pass a parameter to the dialog hide function", function() {
				var sentParameter = null;

				scope.$dialog = {
					hide: function(parameter) {
						sentParameter = parameter;
					}
				};

				var parameter = "pudim";
				scope.closeDialog(parameter);
				expect(sentParameter).toEqual(parameter);
			});
		});
	});
});