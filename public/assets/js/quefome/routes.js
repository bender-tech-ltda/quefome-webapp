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
			path: "/establishments/:establishmentUrl",
			controller: "EstablishmentController",
			templateUrl: "/partials/establishments/establishment.html",
			reloadOnSearch: false
		},
		{
			path: "/order/finish/",
			controller: "SelectPaymentMethodController",
			templateUrl: "/partials/establishments/select-payment-method.html"
		},
		{
			path: "/order/address/",
			templateUrl: "/partials/establishments/inform-delivery-address.html"
		}
	];
});