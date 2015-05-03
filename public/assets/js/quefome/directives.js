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
	}]);

	module.service("Dialog", ["$q", "$rootScope", "TemplateResolver", function($q, $rootScope, TemplateResolver) {
		var Dialog = this;
		Dialog._closing = false;

		this.create = function(params) {
			var deferred = $q.defer();

			if (!params) {
				params = {};
			}

			var dialog = {
				modal: null,

				beforeShow: function(callback) {
					if (this.modal && typeof(callback) === "function") {
						this.modal.on("show.bs.modal", callback);
					}
				},

				afterShow: function(callback) {
					if (this.modal && typeof(callback) === "function") {
						this.modal.on("shown.bs.modal", callback);
					}	
				},

				show: function(callback) {
					if (this.modal) {
						Dialog.hideAll();

						var parent = this.modal.parent();
						if (!parent || parent.length <= 0) {					
							angular.element("body").append(dialog.modal);
						}

						if (typeof(callback) === "function") {
							this.modal.on("shown.bs.modal.afterShownCallback", function(event) {
								$(this).off("shown.bs.modal.afterShownCallback");
								callback.call(this, event);
							});
						}
						
						this.modal.modal({
							backdrop: typeof(params.backdrop) === "undefined" ? true : params.backdrop,
							keyboard: typeof(params.hideOnEsc) === "undefined" ? true : params.hideOnEsc,
						});
					}
				},

				beforeHide: function(callback) {
					if (this.modal && typeof(callback) === "function") {
						this.modal.on("hide.bs.modal", callback);
					}
				},

				afterHide: function(callback) {
					if (this.modal && typeof(callback) === "function") {
						this.modal.on("hidden.bs.modal", callback);
					}	
				},

				onResponse: null,

				hide: function(callbackOrResponse) {
					if (this.modal) {
						this.modal.on("hidden.bs.modal.afterHiddenCallback", function(event) {
							$(this).off("shown.bs.modal.afterHiddenCallback");

							if (typeof(callbackOrResponse) === "function") {
								callbackOrResponse.call(this, event);
							}

							Dialog._closing = false;
						});
						
						if (typeof(this.onResponse) === "function" && typeof(callbackOrResponse) !== "undefined") {
							this.onResponse(callbackOrResponse);
						}

						Dialog._closing = true;
						this.modal.modal("hide");
					}	
				}
			};

			if (typeof(params.onResponse) === "function") {
				dialog.onResponse = params.onResponse;
			}

			var applyTemplate = function(template) {
				var element = angular.element(template);

				if (element.hasClass("modal")) {
					dialog.modal = element;
				} else {
					var contentDiv = angular.element('<div class="modal-content">');
					contentDiv.append(element);

					var dialogDiv = angular.element('<div class="modal-dialog">');
					dialogDiv.append(contentDiv);
					
					dialog.modal = angular.element('<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">');
					dialog.modal.append(dialogDiv);
				}

				if (params.size) {
					if (params.size.trim().toLowerCase() == "large") {
						dialog.modal.find(".modal-dialog").removeClass("modal-sm").addClass("modal-lg");
					} else if (params.size.trim().toLowerCase() == "small") {
						dialog.modal.find(".modal-dialog").removeClass("modal-lg").addClass("modal-sm");
					}
				}

				if (params.beforeShow) {
					dialog.beforeShow(params.beforeShow);
				}

				if (params.afterShow) {
					dialog.afterShow(params.afterShow);
				}

				if (params.beforeHide) {
					dialog.beforeHide(params.beforeHide);
				}

				if (params.afterHide) {
					dialog.afterHide(params.afterHide);
				}

				dialog.modal.on("hidden.bs.modal.removeFromDOMOnClose", function() {
					dialog.modal.remove();
				});

				dialog.modal.data("dialog", dialog);
				deferred.resolve(dialog);

				if (params.show) {
					dialog.show();
				}
			};

			if (params.template) {
				applyTemplate(params.template);
			} else if (params.templateUrl) {
				var newScope = $rootScope.$new();
				newScope.$dialog = dialog;

				TemplateResolver.resolve(params.templateUrl, newScope).then(function(template) {
					newScope.$broadcast("$dialogParameters", params.params);
					applyTemplate(template);
				});
			}

			return deferred.promise;
		};

		this.hideAll = function() {
			var oldDialogs = angular.element(".modal");
			if (oldDialogs && oldDialogs.length > 0) {
				oldDialogs.modal("hide");
			}
		};

		$rootScope.$on("$locationChangeStart", function(event) {
			if (Dialog._closing) {
				return;
			}

			var visibleDialogs = angular.element(".modal:visible");

			if (visibleDialogs && visibleDialogs.length > 0) {
				event.preventDefault();
				visibleDialogs.modal("hide");
			}
		});
	}]);

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

	module.directive("qfRandomClass", [function() {
		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				if (!attrs.qfRandomClass) {
					return;
				}

				var classes = attrs.qfRandomClass.split(",");

				var randomIndex = Math.floor(Math.random() * classes.length);
				var randomClass = classes[randomIndex];

				element.addClass(randomClass.trim());
			}
		};
	}]);

	module.directive("qfToggleClass", [function() {
		return {
			restrict: "A",
			scope: {
				cssClass: "@qfToggleClass",
				targetElement: "@qfToggleTarget",
				on: "=qfToggle"
			},
			link: function(scope, element, attrs) {
				var cssClass = scope.cssClass;
				var targetElement = scope.targetElement ? angular.element(scope.targetElement) : element;

				var toggleFunction = function(toggle) {
					targetElement.toggleClass(cssClass, toggle);
				};

				if (attrs.qfToggle) {
					scope.$watch("on", function(value) {
						toggleFunction(value);
					});

					toggleFunction(scope.on);
				} else {
					toggleFunction();
				}
			}
		};
	}]);

	module.directive("qfStickyScroll", ["$interval", function($interval) {
		var $document = angular.element(document);
		var $window = angular.element(window);

		var events = {
			heightChangeCallbacks: [],
			onDocumentHeightChange: function(callback) {
				this.heightChangeCallbacks.push(callback);

				var that = this;
				return function() {
					var callbackIndex = that.heightChangeCallbacks.indexOf(callback);
					console.log("cancelado height " + callbackIndex);

					if (callbackIndex >= 0) {
						that.heightChangeCallbacks.splice(callbackIndex, 1);
					}
				};
			},

			triggerDocumentHeightChange: function(newHeight, oldHeight) {
				for (var i in this.heightChangeCallbacks) {
					var callback = this.heightChangeCallbacks[i];
					callback.call($document, oldHeight, newHeight, $document);
				}
			},

			scrollChangeCallbacks: [],
			onScrollChange: function(callback) {
				this.scrollChangeCallbacks.push(callback);

				var that = this;
				return function() {
					var callbackIndex = that.scrollChangeCallbacks.indexOf(callback);
					console.log("cancelado scroll " + callbackIndex);

					if (callbackIndex >= 0) {
						that.scrollChangeCallbacks.splice(callbackIndex, 1);
					}
				};
			},
			triggerScrollChange: function(event) {
				for (var i in this.scrollChangeCallbacks) {
					var callback = this.scrollChangeCallbacks[i];
					callback.call($window, event);
				}
			}
		};

		$window.on("scroll.qfStickyScroll", function(event) {
			events.triggerScrollChange(event);
		});

		var lastDocumentHeight = $document.height();
		$interval(function() {
			var documentHeight = $document.height();

			if (lastDocumentHeight != documentHeight) {
				events.triggerDocumentHeightChange(documentHeight, lastDocumentHeight);
			}
		}, 500);

		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				var elementTopPosition = 0;
				var fakeElement = angular.element("<div class='sticky-fake'>");

				var reference = attrs.qfStickyScroll ? attrs.qfStickyScroll : "top";

				var applyStickyScroll = function() {
					var currentScrollHeight = $window.scrollTop();

					var stickyClass = "stick-top";

					if (reference === "bottom") {
						currentScrollHeight	+= $window.height();				
						stickyClass = "stick-bottom";
					}

					if (!element.hasClass(stickyClass)) {
						elementTopPosition = element.position().top;
						fakeElement.css("height", element.outerHeight() + "px");

						if (reference === "bottom") {
							elementTopPosition += element.outerHeight();
						}
					}

					var isntThere = reference === "bottom" ? currentScrollHeight < elementTopPosition : currentScrollHeight > elementTopPosition;

					if (isntThere) {
						if (reference === "bottom") {
							element.before(fakeElement);
						} else {
							element.after(fakeElement);
						}
						
						element.addClass(stickyClass);
					} else {
						fakeElement.remove();
						element.removeClass(stickyClass);
					}
				};

				var cancelScrollChange = events.onScrollChange(applyStickyScroll);
				var cancelHeightChange = events.onDocumentHeightChange(applyStickyScroll);

				scope.$on('$destroy', function() {
					cancelHeightChange();
					cancelScrollChange();
				});
			}
		};
	}]);

	module.directive("qfClickDialogUrl", ["Dialog", function(Dialog) {
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
					Dialog.create({
						templateUrl: scope.url,
						size: scope.size,
						show: true
					});

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
				fetch: "&qfFetchFunction",
				onSelect: "&qfOnSelectItem"
			},
			link: function(scope, element, attrs) {
				var templates = scope.templates || {};
				var fetchFunction = null;

				if (scope.data) {
					fetchFunction = function(query, callback) {
						var regex = new RegExp(query, "g");
						var matches = [];

						for (var i in scope.data) {
							var item = scope.data[i];
							if (item.match(regex)) {
								matches.push({item: item});
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
								result.push({item: item});
							}

							callback(result);
						}});
					};
				}

				element.on("keydown.qfAutocomplete", function(event) {
					if (event.which == 13 && autocomplete && autocomplete.resultIndex < 0) {
						autocomplete.hideResults();
					}
				});

				var autocomplete = new AutoComplete({
					el: element,
					debounceTime: 500,
					threshold: 1,
					limit: 0,
					templates: {
						item: templates.item || scope.template || "{{item}}",
						value: templates.value || scope.template || "{{item}}",
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
					fetch: fetchFunction,
					onItem: function(itemElement) {
						var selectedItem = angular.element(itemElement).data("value");
						element.val(selectedItem).change();

						scope.onSelect({$item: selectedItem});
					}
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

	module.directive("qfInputPrecision", [function() {
		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				var precision = parseInt(attrs.qfInputPrecision);

				element.on("keypress.qfInputPrecision", function(event) {
					var value = element.val();

					if (event.charCode) {
						value += String.fromCharCode(event.charCode);
					}

					value = value.replace(",", ".");

					var digits = (value + "").split(".");
					if (digits.length > 1) {
						if (precision <= 0) {
							event.preventDefault();
							return false;
						} else if (digits[1].length > precision) {
							event.preventDefault();
							return false;
						}
					}
				});
			}
		};
	}]);

	module.directive("qfLoseFocusOnSubmit", [function() {
		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				element.on("submit.qfLoseFocusOnSubmit", function() {
					var focusedElement = element.find(":focus");
					if (focusedElement && focusedElement[0]) {
						focusedElement.blur();
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

	module.directive("form", [function() {
		return {
			restrict: "E",
			require: "form",
			link: function(scope, element, attrs, formController) {
				var submitButton = element.find("button[type='submit']");

				if (!submitButton || !submitButton[0]) {
					var submitButton = angular.element("<button type='submit' style='display: none;'></button>");
					element.append(submitButton);
				}

				formController.$submit = function() {
					submitButton.click();
				};
			}
		};
	}]);
});