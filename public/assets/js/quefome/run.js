define(["angular"], function(angular) {
	return ["$rootScope", "Auth", function($rootScope, Auth) {
		$rootScope.isUserLogged = function() {
			return Auth.isLogged();
		};

		$rootScope.getLoggedUser = function() {
			return Auth.getUser();
		};

		var doItSafe = function(what, callback) {
			if (typeof(callback) !== "function") {
				callback = function() {};
			}

			if (this.$$phase || scope.$root.$$phase) {
				callback.call(this);
			} else {
				this[what](callback);
			}
		}

		$rootScope.$safeDigest = function(callback) {
			doItSafe.call(this, "$digest", callback);
		};

		$rootScope.$safeApply = function(callback) {
			doItSafe.call(this, "$apply", callback);
		};
	}];
});