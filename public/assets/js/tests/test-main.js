"use strict";

var testFiles = [];
for (var file in window.__karma__.files) {
	if (window.__karma__.files.hasOwnProperty(file)) {
		if (file.toLowerCase().indexOf("spec.js") >= 0) {
			testFiles.push(file);
		}
	}
}

require.config({
	baseUrl: "/base/public/assets/js/",
	paths: {
		"jquery": "../../components/jquery/dist/jquery",
		"jquery/autocomplete": "../../components/autocomplete/dist/autocomplete",
		"bootstrap": "../../components/bootstrap/dist/js/bootstrap",
		"bootstrap/datepicker": "../../components/bootstrap-datepicker/dist/js/bootstrap-datepicker",
		"bootstrap/datepicker/br": "../../components/bootstrap-datepicker/dist/locales/bootstrap-datepicker.pt-BR.min",
		"angular": "../../components/angular/angular",
		"angular/route": "../../components/angular-route/angular-route",
		"angular/analytics": "../../components/angulartics/src/angulartics",
		"angular/analytics/ga": "../../components/angulartics/src/angulartics-ga",
		"angular/mock": "../../components/angular-mocks/angular-mocks",
		"quefome/mock": "tests/mock"
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
		"angular/analytics/ga": ["angular", "angular/analytics"],
		"angular/mock": ["angular"]
	},
	deps: testFiles,
	callback: window.__karma__.start,
});

//Caso os testes comecem a falhar repentinamente, talvez seja necessaria setar essa opção
//https://docs.angularjs.org/guide/bootstrap
//window.name = "NG_DEFER_BOOTSTRAP!";