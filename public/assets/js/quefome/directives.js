"use strict";

define(["angular", "bootstrap"], function(angular) {
	var module = angular.module("qfDirectives", []);

	module.directive("qfPopover", ["$compile", "$http", "$templateCache", function($compile, $http, $templateCache) {
		return {
			restrict: "A",
			scope: {
				title: "@qfPopoverTitle",
				content: "@qfPopoverContent",
				placement: "@qfPopoverPlacement",
				trigger: "@qfPopoverTrigger",
				contentUrl: "@qfPopoverUrl"
			},
			link: function(scope, element, attrs) {
				if (!scope.trigger) {
					scope.trigger = "click";
				}

				if (!scope.placement) {
					scope.placement = "bottom";
				}

				if (scope.contentUrl) {
					$http.get(scope.contentUrl, {cache: $templateCache}).success(function(html) {
          				element.popover({
          					content: $compile(html)(scope),
          					placement: scope.placement,
          					trigger: scope.trigger,
          					html: true
          				});
        			});
				} else {
					element.popover({
						title: scope.title,
						content: scope.content,
						placement: scope.placement,
						trigger: scope.trigger
					});
				}
			}
		};
	}]);
});