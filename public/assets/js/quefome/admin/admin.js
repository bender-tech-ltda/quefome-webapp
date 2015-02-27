define(["angular", "quefome/admin/routes", "quefome/admin/services" ,"quefome/admin/controllers","angular/route"], function(angular, routes) {
	"use strict";
	
	var quefomeAdmin = angular.module("quefomeAdmin", ["ngRoute", "qfAdminServices", "qfAdminControllers"]);

	quefomeAdmin.config(["$routeProvider", function($routeProvider) {
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

	quefomeAdmin.run(["$rootScope", function($rootScope) {
		if ($rootScope.checkForLoggedUser) {
			$rootScope.checkForLoggedUser();
		}
	}]);

	return quefomeAdmin;
});