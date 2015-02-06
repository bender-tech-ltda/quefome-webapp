define([], function() {
	"use strict";
	
	return [
		{
			path: "/",
			controller: "HomeController",
			templateUrl: "/partials/home/index.html"
		},
		{
			path: "/deliveries/search/",
			controller: "SearchDeliveryController",
			templateUrl: "/partials/deliveries/search.html",
			reloadOnSearch: false
		}
	];
});