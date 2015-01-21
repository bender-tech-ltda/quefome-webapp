"use strict";

define(["jquery", "angular", "angular/mock"], function($, angular) {
	var object = window ? window : global;

	function getView(url, $templateCache) {
		var view = $templateCache.get(url);

    	if(!view) {
        	view = $.ajax(url, {async: false}).responseText;
        	$templateCache.put(url, view);
    	}

    	return angular.element(view);
	}

	object.injectController = function(controllerName, viewUrl, params, callback) {
		if (viewUrl) {
			viewUrl = viewUrl.trim();

			if (viewUrl.indexOf("/") != 0) {
				viewUrl = "/base/" + viewUrl;
			}
		}

		if (!params) {
			params = {};
		}

		if (typeof(callback) !== "function") {
			callback = function() {};
		}

		return inject(function($templateCache, $rootScope, $compile, $controller) {
			if (!params.$scope) {
				params.$scope = $rootScope.$new();
			}

			if (viewUrl) {
				var view = getView(viewUrl, $templateCache);
				
				if (view && view[0]) {
					view.find("[ng-controller='" + controllerName + "']").removeAttr("ng-controller");

					$compile(view)(params.$scope);
				
					var viewScope = view.scope();
					if (viewScope && viewScope != params.$scope) {
						params.$scope = viewScope;
					}

					var controller = $controller(controllerName, params);

					params.$scope.$digest();
					callback(params.$scope, controller, params);
				} else {
					throw "A view " + viewUrl + " parece nao ter sida carregada corretamente: " + view;
				}
			} else {
				var controller = $controller(controllerName, params);

				params.$scope.$digest();
				callback(params.$scope, controller, params);
			}
		});
	}

	return object;
});