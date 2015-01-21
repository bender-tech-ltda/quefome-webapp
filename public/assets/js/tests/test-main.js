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
		"bootstrap": "../../components/bootstrap/dist/js/bootstrap",
		"angular": "../../components/angular/angular",
		"angular/route": "../../components/angular-route/angular-route",
		"angular/mock": "../../components/angular-mocks/angular-mocks",
		"quefome/mock": "tests/mock"
	},
	shim: {
		"jquery": {"exports" : "jquery"},
		"bootstrap": ["jquery"],
		"angular" : {
			deps: ["jquery"],
			exports : "angular"
		},
		"angular/route": ["angular"],
		"angular/mock": ["angular"]
	},
	deps: testFiles,
	callback: window.__karma__.start,
});

/**
//Isso faz com que o angular pause sua inicializacao ate que o metodo resumeBootstrap seja chamado
//https://docs.angularjs.org/guide/bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require(["angular", "quefome"], function(angular, quefomeApp) {
	angular.element().ready(function() {
		angular.bootstrap(document, [quefomeApp.name]);	
	});
});
**/