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

	quefome.run(["$rootScope", "$route", "$location", "$timeout", function($rootScope, $route, $location, $timeout) {
		if (!$rootScope.$app) {
			$rootScope.$app = {
				route: {loading: false, loadingMessage: false}
			};
		}

		$rootScope.$on('$routeChangeStart', function () {
			var nextRoute = $route.routes[$location.path()];

			if (nextRoute && nextRoute.loadingMessage) {
				$rootScope.$app.route.loadingMessage = nextRoute.loadingMessage;
			} else {
				$rootScope.$app.route.loadingMessage = false;
			}

			$rootScope.$app.route.loading = true;
			console.log('$routeChangeStart');
		});

		$rootScope.$on('$routeChangeSuccess', function () {
			console.log('$routeChangeSuccess');

			$timeout(function(){
				$rootScope.$app.route.loading = false;
			}, 200);
		});

		$rootScope.$on('$routeChangeError', function () {
			alert('wtff');
			$rootScope.$app.route.loading = false;
		});

		if ($rootScope.checkForLoggedUser) {
			$rootScope.checkForLoggedUser();
		}
	}]);

	return quefome;
});