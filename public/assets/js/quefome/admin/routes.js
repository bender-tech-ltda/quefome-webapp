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
			redirectTo: "/orders/real-time/"
		},
		{
			path: "/orders/real-time/",
			controller: "RealTimeOrdersController",
			templateUrl: "/admin/partials/orders/real-time.html"
		}
	];
});