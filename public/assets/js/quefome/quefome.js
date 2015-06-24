define(["angular", "quefome/routes", "quefome/services" ,"quefome/controllers", "angular/route"], function(angular, routes) {
	"use strict";
	
	var quefome = angular.module("quefome", ["ngRoute", "qfServices", "qfControllers"]);

	quefome.config(["$routeProvider", function($routeProvider) {
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

	}]);

	quefome.run(["$rootScope", function($rootScope, $route, $location, $timeout) {
		if ($rootScope.checkForLoggedUser) {
			$rootScope.checkForLoggedUser();
		}
	}]);

	return quefome;
});