define(["angular", "quefome/admin/routes", "quefome/admin/services" ,"quefome/admin/controllers","angular/route"], function(angular, routes) {
	"use strict";
	
	var quefome = angular.module("quefomeAdmin", ["ngRoute", "qfAdminServices", "qfAdminControllers"]);

	quefome.config(["$routeProvider", function($routeProvider) {
		var configureRoutes = function() {
			for (var i in routes) {
				var route = routes[i];

				if (route.path) {
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

	return quefome;
});