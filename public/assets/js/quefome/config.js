"use strict";

define(["angular", "quefome/routes"], function(angular, routes) {
	return ["$routeProvider", function($routeProvider) {
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

	}];
});