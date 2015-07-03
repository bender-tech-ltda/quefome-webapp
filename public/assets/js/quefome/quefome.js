define(["angular", "quefome/routes", "quefome/services" ,"quefome/controllers", "angular/route", "angular/analytics/ga"], function(angular, routes) {
	"use strict";
	
	var quefome = angular.module("quefome", ["ngRoute", "angulartics", "angulartics.google.analytics", "qfServices", "qfControllers"]);

	quefome.config(["$locationProvider", "$routeProvider", "$analyticsProvider", function($locationProvider, $routeProvider, $analyticsProvider) {
		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false
		});

		var configureRoutes = function() {
			for (var i in routes) {
				var route = routes[i];

				if (route && route.path) {
					$routeProvider.when(route.path, route);
				}
			}

			$routeProvider.otherwise({
				controller: "NotFoundController",
				templateUrl: "/partials/errors/404.html"
			});
		};

		configureRoutes();

		$analyticsProvider.firstPageview(false);

		if (window.debug) {
			$analyticsProvider.developerMode(true);
		}
	}]);

	quefome.run(["$rootScope", function($rootScope, $route, $location, $timeout) {
		if ($rootScope.checkForLoggedUser) {
			$rootScope.checkForLoggedUser();
		}
	}]);

	return quefome;
});