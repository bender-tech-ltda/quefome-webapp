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
		});
	});
});