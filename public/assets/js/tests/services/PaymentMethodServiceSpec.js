"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("PaymentMethodService", function() {
		var $httpBackend, PaymentMethodService;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_PaymentMethodService_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			PaymentMethodService = _PaymentMethodService_;
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		describe("the list function", function() {
			it("should return a list of paymentMethods", function() {
				var paymentMethodsResponse = [{name: "Dinheiro", category: {name: "Dinheiro"}}];
				$httpBackend.expectGET("/api/payment-methods/").respond(200, paymentMethodsResponse);

				PaymentMethodService.list().then(function(paymentMethods) {
					expect(paymentMethods).toEqual(paymentMethodsResponse);
				});

				$httpBackend.flush();
			});
		});
	});
});