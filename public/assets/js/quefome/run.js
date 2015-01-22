define(["angular"], function(angular) {
	return ["$rootScope", "AuthService", function($rootScope, AuthService) {
		$rootScope.isUserLogged = function() {
			return AuthService.isLogged();
		};

		$rootScope.getLoggedUser = function() {
			return AuthService.getUser();
		};

		var doItSafe = function(what, callback) {
			if (typeof(callback) !== "function") {
				callback = function() {};
			}

			if (this.$$phase || this.$root.$$phase) {
				callback.call(this);
				return function() {};
			} else {
				return this[what](callback);
			}
		}

		$rootScope.__$digest = $rootScope.$digest;
		$rootScope.$digest = function(callback) {
			return doItSafe.call(this, "__$digest", callback);
		};

		$rootScope.__$apply = $rootScope.$apply;
		$rootScope.$apply = function(callback) {
			doItSafe.call(this, "__$apply", callback);
		};

		AuthService.checkForLoggedUser().then(function() {
			$rootScope.$apply();
		});
	}];
});