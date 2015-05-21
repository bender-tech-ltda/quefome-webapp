define(["angular", "bootstrap", "quefome/directives"], function(angular) {
	"use strict";
	
	var module = angular.module("qfAdminDirectives", ["qfDirectives"]);

	module.directive("qfOnClickToggleClass", [function() {
		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				if (!attrs.qfOnClickToggleClass) {
					return;
				}


				var targetElement = element;

				if (attrs.qfToggleTarget) {
					targetElement = angular.element(attrs.qfToggleTarget);
				}

				element.on("click.qfToggleClass", function() {
					targetElement.toggleClass(attrs.qfOnClickToggleClass);
				});
			}
		};
	}]);
});