"use strict";

require.config({
	baseUrl: "/assets/js/",
	paths: {
		"jquery": "/components/jquery/dist/jquery",
		"jquery/autocomplete": "/components/autocomplete/dist/autocomplete",
		"bootstrap": "/components/bootstrap/dist/js/bootstrap",
		"angular": "/components/angular/angular",
		"angular/route": "/components/angular-route/angular-route",
		"angular/analytics": "/components/angulartics/src/angulartics",
		"angular/analytics/ga": "/components/angulartics/src/angulartics-ga"
	},
	shim: {
		"jquery": {"exports" : "jquery"},
		"bootstrap": ["jquery"],
		"angular" : {
			deps: ["jquery"],
			exports : "angular"
		},
		"angular/route": ["angular"],
		"angular/analytics": {
			deps: ["angular"],
			exports : "angular/analytics"
		},
		"angular/analytics/ga": ["angular", "angular/analytics"]
	}
});

//Isso faz com que o angular pause sua inicializacao ate que o metodo resumeBootstrap seja chamado
//https://docs.angularjs.org/guide/bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require(["angular", "quefome/quefome"], function(angular, quefomeApp) {
	angular.element().ready(function() {
		angular.resumeBootstrap([quefomeApp.name]);	
	});
});