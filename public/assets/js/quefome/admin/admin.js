define(["angular", "quefome/admin/routes", "quefome/admin/services" ,"quefome/admin/controllers","angular/route", "angular/analytics/ga"], function(angular, routes) {
	"use strict";
	
	var quefomeAdmin = angular.module("quefomeAdmin", ["ngRoute", "angulartics", "angulartics.google.analytics", "qfAdminServices", "qfAdminControllers"]);

	quefomeAdmin.config(["$locationProvider", "$routeProvider", "$analyticsProvider", function($locationProvider, $routeProvider, $analyticsProvider) {
		$locationProvider.html5Mode(true);

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

		$analyticsProvider.firstPageview(false);

		if (window.debug) {
			$analyticsProvider.developerMode(true);
		}
	}]);

	quefomeAdmin.run(["$rootScope", "$route", "$location", "AuthService", function($rootScope, $route, $location, AuthService) {
		var checkForLocationAccess = function(event) {
			var nextRoute = $route.routes[$location.path()];

			if (nextRoute) {
				if (nextRoute.login && !AuthService.isLogged()) {
					if (event && event.preventDefault) {
						event.preventDefault();
					}

					$location.path("/login");
				} else if (nextRoute.path == "/login" && AuthService.isLogged()) {
					$location.path("/");
				}
			}
		};

		$rootScope.$on("$locationChangeStart", function(event) {
			if (!AuthService.hasCheckedForLoggedUser()) {
				return;
			}

			checkForLocationAccess(event);
		});

		if ($rootScope.checkForLoggedUser) {
			$rootScope.checkForLoggedUser().then(function() {
				checkForLocationAccess();
			});
		}
	}]);

	return quefomeAdmin;
});