define([], function() {
	"use strict";
	
	return [
		// {
		// 	path: "/",
		// 	controller: "HomeController",
		// 	templateUrl: "/admin/partials/home/index.html"
		// }
		{
			path: "/",
			redirectTo: "/orders/fulfillment/"
		},
		{
			path: "/orders/fulfillment/",
			controller: "OrdersFullfillmentController",
			templateUrl: "/admin/partials/orders/fullfillment.html"
		}
	];
});