define([], function() {
	"use strict";
	
	return [
		// {
		// 	path: "/",
		// 	controller: "HomeController",
		// 	templateUrl: "/admin/partials/home/index.html"
		// }
		{
			path: "/login"
		},
		{
			path: "/",
			redirectTo: "/orders/fulfillment/",
			login: true
		},
		{
			path: "/orders/fulfillment/",
			controller: "OrdersFullfillmentController",
			templateUrl: "/admin/partials/orders/fullfillment.html",
			login: true
		},
		{
			path: "/orders/",
			controller: "OrderSearchController",
			templateUrl: "/admin/partials/orders/search.html",
			login: true
		}
	];
});