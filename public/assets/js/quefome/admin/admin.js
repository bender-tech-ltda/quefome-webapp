define(["angular", "quefome/admin/routes", "quefome/admin/services" ,"quefome/admin/controllers","angular/route", "angular/analytics/ga"], function(angular, routes) {
	"use strict";
	
	var quefomeAdmin = angular.module("quefomeAdmin", ["ngRoute", "angulartics", "angulartics.google.analytics", "qfAdminServices", "qfAdminControllers"]);

	quefomeAdmin.config(["$locationProvider", "$routeProvider", "$analyticsProvider", "$provide", function($locationProvider, $routeProvider, $analyticsProvider, $provide) {
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

		if (window.debug) {
			$analyticsProvider.developerMode(true);
		}

		$analyticsProvider.firstPageview(false);

		$provide.decorator("$exceptionHandler", ["$delegate", "$analytics", function($delegate, $analytics) {
			return function(exception, cause) {
				$delegate(exception, cause);
				
				var errorObject = {
					name: exception.name,
					message: exception.message
				};

				if (exception.stack) {
					errorObject.stack = exception.stack;
				}

				if (exception.lineNumber) {
					errorObject.line = exception.lineNumber;
				}

				if (exception.columnNumber) {
					errorObject.column = exception.columnNumber;
				}

				if (exception.fileName) {
					errorObject.file = exception.fileName;
				}

				$analytics.eventTrack("AngularJS Error", {
					category: 'Error',
					label: angular.toJson(errorObject, true),
					nonInteraction: true
				});
			};
		}]);
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