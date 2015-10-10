define(["angular", "quefome/routes", "quefome/services" ,"quefome/controllers", "angular/route", "angular/analytics/ga"], function(angular, routes) {
	"use strict";
	
	var quefome = angular.module("quefome", ["ngRoute", "angulartics", "angulartics.google.analytics", "qfServices", "qfControllers"]);

	quefome.config(["$locationProvider", "$routeProvider", "$analyticsProvider", "$provide", function($locationProvider, $routeProvider, $analyticsProvider, $provide) {
		$locationProvider.hashPrefix("!");
		
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

	quefome.run(["$rootScope", function($rootScope, $route, $location, $timeout) {
		if ($rootScope.checkForLoggedUser) {
			$rootScope.checkForLoggedUser();
		}
	}]);

	angular.element(document).ready(function() {
		angular.bootstrap(document, ["quefome"], {
			strictDi: true
		});	
	});

	return quefome;
});