"use strict";

require.config({
	baseUrl: "/assets/js/",
	paths: {
		"jquery": "/components/jquery/dist/jquery",
		"bootstrap": "/components/bootstrap/dist/js/bootstrap",
		"angular": "/components/angular/angular",
		"angular/route": "/components/angular-route/angular-route"
	},
	shim: {
		"jquery": {"exports" : "jquery"},
		"bootstrap": ["jquery"],
		"angular" : {
			deps: ["jquery"],
			exports : "angular"
		},
		"angular/route": ["angular"]
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