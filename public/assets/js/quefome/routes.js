define([], function() {
	"use strict";
	
	return [
		{
			path: "/",
			controller: "HomeController",
			templateUrl: "/partials/home/index.html"
		},
		{
			path: "/establishments/search/",
			controller: "SearchEstablishmentController",
			templateUrl: "/partials/establishments/search.html",
			reloadOnSearch: false
		},
		{
			path: "/order/finish/",
			controller: "SelectPaymentMethodController",
			templateUrl: "/partials/establishments/select-payment-method.html"
		}
	];
});