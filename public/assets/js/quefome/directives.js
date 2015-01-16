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

	module.directive("qfClickDialogUrl", ["TemplateResolver", function(TemplateResolver) {
		return {
			restrict: "A",
			scope: {
				url: "@qfClickDialogUrl",
				size: "@qfDialogSize"
			},
			link: function(scope, element, attrs) {
				element.click(function() {
					var content = angular.element('<div class="modal-content">');

					var dialog = angular.element('<div class="modal-dialog">');
					dialog.append(content);
					
					var modal = angular.element('<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">');
					modal.append(dialog);

					if (scope.size) {
						if (scope.size.trim().toLowerCase() == "large") {
							dialog.addClass("modal-lg");
						} else if (scope.size.trim().toLowerCase() == "small") {
							dialog.addClass("modal-sm");
						}
					}

					modal.on("hidden.bs.modal", function() {
						modal.remove();
					});

					TemplateResolver.resolve(scope.url, scope).then(function(html) {
						var htmlEl = angular.element(html);

						if (htmlEl.hasClass("modal")) {
							modal = htmlEl;
						} else {
							content.append(html);
						}

						angular.element("body").append(modal);
						modal.modal("show");
					});

					return false;
				});
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