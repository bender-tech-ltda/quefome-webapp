define([], function() {
	"use strict";
	
	return [
		{
			path: "/",
			controller: "HomeController",
			templateUrl: "/partials/home/index.html"
		},
		{
			path: "/restaurantes",
			controller: "SearchEstablishmentController",
			templateUrl: "/partials/establishments/search.html",
			reloadOnSearch: false
		},
		{
			path: "/:establishmentUrl",
			controller: "EstablishmentController",
			templateUrl: "/partials/establishments/establishment.html",
			loadingMessage: "Carregando um estabelecimento ultra-master delicioso..."
		},
		{
			path: "/:establishmentUrl/pedido/finalizar",
			controller: "OrderFinishController",
			templateUrl: "/partials/orders/finish.html",
		},
		{
			path: "/usuario/pedidos",
			controller: "OrderTrackController",
			templateUrl: "/partials/orders/track.html",
		}
	];
});