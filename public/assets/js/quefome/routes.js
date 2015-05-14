define([], function() {
	"use strict";
	
	return [
		{
			path: "/",
			controller: "HomeController",
			templateUrl: "/partials/home/index.html"
		},
		{
			path: "/establishments/search",
			controller: "SearchEstablishmentController",
			templateUrl: "/partials/establishments/search.html",
			reloadOnSearch: false
		},
		{
			path: "/establishments/:establishmentUrl",
			controller: "EstablishmentController",
			templateUrl: "/partials/establishments/establishment.html"
		},
		{
			path: "/establishments/:establishmentUrl/order/finish",
			controller: "OrderFinishController",
			templateUrl: "/partials/orders/finish.html",
		},
		{
			path: "/user/orders",
			//controller: "OrderFinishController",
			template: "<h1>Em desenvolvimento...</h1>",
		}
	];
});