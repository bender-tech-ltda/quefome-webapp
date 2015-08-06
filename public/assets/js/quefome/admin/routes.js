define([], function() {
	"use strict";
	
	return [
		// {
		// 	path: "/",
		// 	controller: "HomeController",
		// 	templateUrl: "/admin/partials/home/index.html"
		// }
		{
			path: "/login",
			pageInfo: {
				title: "Acesso restrito | Quefo.me Admin"
			}
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
			login: true,
			pageInfo: {
				title: "Atendimento de Pedidos | Quefo.me Admin"
			}
		},
		{
			path: "/orders/",
			controller: "OrderSearchController",
			templateUrl: "/admin/partials/orders/search.html",
			login: true,
			pageInfo: {
				title: "Pesquisa de Pedidos | Quefo.me Admin"
			}
		}
	];
});