"use strict";

require.config({
	baseUrl: "/assets/js/",
	paths: {
		"jquery": "/components/jquery/dist/jquery",
		"jquery/autocomplete": "/components/autocomplete/dist/autocomplete",
		"bootstrap": "/components/bootstrap/dist/js/bootstrap",
		"bootstrap/datepicker": "/components/bootstrap-datepicker/dist/js/bootstrap-datepicker",
		"bootstrap/datepicker/br": "/components/bootstrap-datepicker/dist/locales/bootstrap-datepicker.pt-BR.min",
		"angular": "/components/angular/angular",
		"angular/route": "/components/angular-route/angular-route",
		"angular/analytics": "/components/angulartics/src/angulartics",
		"angular/analytics/ga": "/components/angulartics/src/angulartics-ga"
	},
	shim: {
		"jquery": {"exports" : "jquery"},
		"bootstrap": ["jquery"],
		"bootstrap/datepicker": ["jquery", "bootstrap"],
		"bootstrap/datepicker/br": ["jquery", "bootstrap/datepicker"],
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

require(["angular", "quefome/admin/admin"], function(angular, quefomeAdminApp) {
	angular.element().ready(function() {
		angular.resumeBootstrap([quefomeAdminApp.name]);	
	});
});