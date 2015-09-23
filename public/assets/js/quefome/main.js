"use strict";

require.config({
	baseUrl: "/assets/js/",
	paths: {
		"jquery": "../../components/jquery/dist/jquery",
		"jquery/autocomplete": "../../components/autocomplete/dist/autocomplete",
		"bootstrap": "../../components/bootstrap/dist/js/bootstrap",
		"angular": "../../components/angular/angular",
		"angular/route": "../../components/angular-route/angular-route",
		"angular/analytics": "../../components/angulartics/src/angulartics",
		"angular/analytics/ga": "../../components/angulartics/src/angulartics-ga"
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
			exports : "angularAnalytics"
		},
		"angular/analytics/ga": ["angular", "angular/analytics"]
	}
});

require(["quefome/quefome"]);