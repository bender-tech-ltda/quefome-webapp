define(["angular", "bootstrap", "quefome/directives"], function(angular) {
	"use strict";
	
	var module = angular.module("qfAdminDirectives", ["qfDirectives"]);

	module.directive("qfToggleClass", [function() {
		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				if (!attrs.qfToggleClass) {
					return;
				}


				var targetElement = element;

				if (attrs.qfToggleTarget) {
					targetElement = angular.element(attrs.qfToggleTarget);
				}

				element.on("click.qfToggleClass", function() {
					targetElement.toggleClass(attrs.qfToggleClass);
				});
			}
		};
	}]);
});