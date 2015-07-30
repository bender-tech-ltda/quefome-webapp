define([], function() {
	"use strict";
	
	return [
		{
			path: "/",
			controller: "HomeController",
			templateUrl: "/partials/home/index.html"
		},
		{
			path: "/restaurantes/:productType?",
			controller: "SearchEstablishmentController",
			templateUrl: "/partials/establishments/search.html",
			pageInfo: {
				title: "Procure estabelecimentos - Quefo.me",
				description: "#partiu procurar o restaurante do seu rango de hoje? Encontre os melhores deliveries de Porto Alegre."
			},
			reloadOnSearch: false
		},
		{
			path: "/:establishmentUrl",
			controller: "EstablishmentController",
			templateUrl: "/partials/establishments/establishment.html",
			pageInfo: {
				title: "Restaurante - Quefo.me",
				description: "Estabelecimento ultra-master delicioso"
			},
			loadingMessage: "Carregando um estabelecimento ultra-master delicioso...",
		},
		{
			path: "/:establishmentUrl/pedido/finalizar",
			controller: "OrderFinishController",
			templateUrl: "/partials/orders/finish.html",
			pageInfo: {
				title: "Finalize seu pedido - Quefo.me",
				description: "É só finalizar seu pedido e acabar com essa fome!"
			}
		},
		{
			path: "/usuario/pedidos",
			controller: "OrderTrackController",
			templateUrl: "/partials/orders/track.html",
			pageInfo: {
				title: "Acompanhe seus pedidos - Quefo.me",
				description: "Fique de olho no status do seu pedido."
			}
		}
	];
});