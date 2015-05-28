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

	module.directive("qfInputDate", [function() {
		return {
			restrict: "A",
			link: function(scope, element, attrs) {
				var browserSupportsDateInput = function() {
					var inputDate = document.createElement("input");
					inputDate.setAttribute("type", "date");

					return inputDate.type == "date";
				};

				var browserDisplaysDatePicker = function() {
					var nonDateString = "um-valor-que-nao-e-uma-data";

					var inputDate = document.createElement("input");
					inputDate.setAttribute("type", "date");
					inputDate.setAttribute('value', nonDateString);

					return inputDate.value != nonDateString;
				};

				if (!browserSupportsDateInput() || !browserDisplaysDatePicker()) {
					alert("não suporta date input ou date picker");
				} else {
					alert("suporta as porra tudo");
				}
			}
		};
	}]);
});