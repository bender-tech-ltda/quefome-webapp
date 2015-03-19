define(["angular", "bootstrap", "jquery/autocomplete"], function(angular, bootstrap, AutoComplete) {
	"use strict";
	
	var module = angular.module("qfDirectives", []);

	module.service("TemplateResolver", ["$compile", "$http", "$templateCache", function($compile, $http, $templateCache) {
		this.resolve = function(url, compileScope) {
			var requestConfig = {
				cache: $templateCache,
				headers: {
					"Accept": "text/html,application/xhtml+xml,application/xml"
				}
			};

			return $http.get(url, requestConfig).then(function(response) {
				var content = response.data;
				return compileScope ? $compile(content)(compileScope) : content;
			});
		};
	}])

	module.directive("qfHref", ["$location", function($location) {
		return {
			restrict: "A",
			scope: {
				href: "@qfHref",
				query: "=qfHrefQuery"
			},
			link: function(scope, element, attrs) {
				if (element.is("a")) {
					element.attr("href", "#" + scope.href);
				} else {
					element.click(function() {
						scope.$apply(function() {
							var location = $location.path(scope.href);
							
							if (scope.query) {
								location.search(scope.query);
							}
						});
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
				size: "@qfDialogSize",
				event: "@qfShowOn"
			},
			link: function(scope, element, attrs) {
				var event = scope.event ? scope.event : "click";

				element.on(event + ".qfClickDialogUrl", function() {
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

					var newScope = scope.$root.$new();

					TemplateResolver.resolve(scope.url, newScope).then(function(html) {
						var htmlEl = angular.element(html);

						if (htmlEl.hasClass("modal")) {
							modal = htmlEl;
						} else {
							content.html(html);
						}

						var show = function() {
							angular.element("body").append(modal);
							modal.modal("show");
						};

						if (scope.$parent.$dialog) {
							scope.$parent.$dialog.close(show);
						} else {
							show();
						}
					});

					newScope.$dialog = {
						close: function(callback) {
							if (typeof(callback) === "function") {
								modal.on("hidden.bs.modal.afterCloseCallback", function() {
									modal.off("hidden.bs.modal.afterCloseCallback");
									callback.call(modal, modal);
								});
							}

							modal.modal("hide");
						}
					};

					return false;
				});
			}
		};

	}]);

	module.directive("qfModal", [function() {
		return {
			restrict: "E",
			template: "<div class='modal fade' ng-transclude></div>",
			replace: true,
			transclude: true,
			scope: {
				openOnLoad: "=qfModalOpenOnLoad"
			},
			link: function(scope, element, attrs) {
				if (scope.openOnLoad) {
					element.ready(function() {
						element.modal("show");
					});
				}

				scope.$parent.$dialog = {
					open: function(callback) {
						return element.modal("show");
					},
					close: function(callback) {
						return element.modal("hide");
					}
				};
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
					TemplateResolver.resolve(scope.contentUrl, scope.$root).then(function(html) {
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

	module.directive("qfAutocomplete", ["$timeout", function($timeout) {
		return {
			restrict: "A",
			scope: {
				templates: "=qfResultTemplate",
				template: "@qfResultTemplate",
				data: "=qfData",
				fetch: "&qfFetchFunction"
			},
			link: function(scope, element, attrs) {
				var fetchFunction = null;
				if (scope.data) {
					fetchFunction = function(query, callback) {
						var regex = new RegExp(query, "g");
						var matches = [];

						for (var i in scope.data) {
							var item = scope.data[i];
							if (item.match(regex)) {
								matches.push({value: item});
							}
						}

						callback(matches);
					};
				} else {
					fetchFunction = function(query, callback) {
						scope.fetch({$query: query, $callback: function(data) {
							var result = [];

							for (var i in data) {
								var item = data[i];
								result.push(typeof(item) === "string" ? {value: item} : item);
							}

							$timeout(function() {
								callback(result);
							}, 5000);
						}});
					};
				}

				var templates = scope.templates || {};

				var autocomplete = new AutoComplete({
					el: element,
					threshold: 1,
					limit: 0,
					templates: {
						item: templates.item || scope.template || "{{value}}",
						value: templates.value || scope.template || "{{value}}",
						empty: templates.empty || "Nenhum resultado encontrado"
					},
					extraClasses: {
						wrapper:     "autocomplete",
						results:     "result",
						list:        "list",
						item:        "item",
						highlighted: "highlighted",
						disabled:    "disabled",
						empty:       "empty",
						searchTerm:  "search-term",
						loading:     "loading"
					},
					fetch: fetchFunction
				});

				element.on("focusin.qfAutocomplete", function() {
					var value = element.val();
					if (value && value.trim().length > 0) {
						autocomplete.searchTerm = value;

						$timeout(function() {
							autocomplete.processSearch();
						}, 1);
					}
				});
			}
		};
	}]);

	module.directive("qfShowValidationState", [function() {
		return {
			restrict: "A",
			require: '^form',
			scope: {
				showValidation: "=qfShowValidationState",
				validateAlways: "=qfValidateAlways",
				showValid: "=qfValidState",
				showInvalid: "=qfInvalidState"
			},
			link: function(scope, element, attrs, formController) {
				if ((scope.showValidation === false) || !attrs.name || !formController[attrs.name]) {
					return;
				}

				var checkAndApplyState = function(touched) {
					var property = formController[attrs.name];
					var invalid = property.$dirty && property.$invalid;

					var elementsToApplyState = findElementsToApplyState();

					if (property.$valid) {
						elementsToApplyState.removeClass("invalid");

						if (scope.showValid) {
							elementsToApplyState.addClass("valid");
						}
					} else if (touched || property.$touched || scope.validateAlways) {
						elementsToApplyState.removeClass("valid");

						if (typeof(scope.showInvalid) === "undefined" || scope.showInvalid) {
							elementsToApplyState.addClass("invalid");
						}
					}
				};

				var findElementsToApplyState = function() {
					var elementsToApplyState = element;
					var parent = element.parent();

					var elementLabel = parent.find("[for='" + attrs.name + "']");
					if (elementLabel && elementLabel.length > 0) {
						elementsToApplyState = elementsToApplyState.add(elementLabel);
					}

					return elementsToApplyState;
				};

				element.on("blur.qfValidateState", function() {
					checkAndApplyState(true);
				});

				element.on("change.qfValidateState", function() {
					checkAndApplyState(true);
				});

				element.on("keyup.qfValidateState", function() {
					checkAndApplyState(false);
				});
			}
		};
	}]);
});