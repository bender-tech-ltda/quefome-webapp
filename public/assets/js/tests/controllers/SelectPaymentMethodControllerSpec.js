"use strict";

define(["angular", "quefome/mock", "quefome/controllers"], function(angular) {

	describe("SearchEstablishmentController", function() {
		var scope, controller, MockedPaymentMethodService;

		beforeEach(module("qfControllers"));

		beforeEach(function() {
			var categories = {
				"cartao": {
					name: "Cartão"
				},

				"dinheiro": {
					name: "Dinheiro"
				}
			};

			MockedPaymentMethodService = {
				called: false,
				categoriesSize: Object.keys(categories).length,

				_list: [
					{
						name: "Dinheiro",
						category: categories["dinheiro"]
					},
					{
						name: "Mastercard",
						category: categories["cartao"]
					},
					{
						name: "Visa",
						category: categories["cartao"]
					}
				],

				list: function() {
					this.called = true;
					var list = this._list;

					return {
						then: function(callback) {
							callback(list);
						}
					};
				}
			};
		});

		beforeEach(function() {
			var params = {
				PaymentMethodService: MockedPaymentMethodService
			};

			return injectController("SelectPaymentMethodController", "views/partials/establishments/select-payment-method.html", params, function($scope) {
				scope = $scope;
			});
		});

		it("should have a paymentCategories property", function() {
			expect(scope.paymentCategories).toBeDefined();
		});

		it("should have a order property", function() {
			expect(scope.order).toBeDefined();
		});

		describe("should get a list of paymentMethods", function() {
			it("on startup", function() {
				expect(MockedPaymentMethodService.called).toBe(true);
			});

			it("and group the list by paymentCategories", function() {
				expect(scope.paymentCategories).toBeDefined();
				expect(scope.paymentCategories.length).toEqual(MockedPaymentMethodService.categoriesSize);
			});
		});
	});
});