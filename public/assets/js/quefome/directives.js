"use strict";

define(["angular", "bootstrap"], function(angular) {
	var module = angular.module("qfDirectives", []);

	module.service("TemplateResolver", ["$compile", "$http", "$templateCache", function($compile, $http, $templateCache) {
		this.resolve = function(url, compileScope) {
			return $http.get(url, {cache: $templateCache}).then(function(response) {
				var content = response.data;
				return compileScope ? $compile(content)(compileScope) : content;
			});
		};
	}])

	module.directive("qfHref", ["$location", function($location) {
		return {
			restrict: "A",
			scope: {
				href: "@qfHref"
			},
			link: function(scope, element, attrs) {
				if (element.is("a")) {
					element.attr("href", "#" + scope.href);
				} else {
					element.click(function() {
						$location.path(scope.href);
						return false;
					});
				}
			}
		};
	}]);

	module.directive("qfPopover", ["TemplateResolver", function(TemplateResolver) {
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
					TemplateResolver.resolve(scope.contentUrl, scope).then(function(html) {
						element.popover({
							content: html,
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