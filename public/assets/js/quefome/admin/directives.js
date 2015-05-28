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
					var cssDatePicker = document.getElementById("cssDatePicker.qfInputDate");

					if (!cssDatePicker) {
						cssDatePicker = document.createElement("link");
						cssDatePicker.type = "text/css";
						cssDatePicker.rel = "stylesheet";
						cssDatePicker.href = "/components/bootstrap-datepicker/dist/css/bootstrap-datepicker3.min.css";

						document.getElementsByTagName("head")[0].appendChild(cssDatePicker);
					}

					require(["bootstrap/datepicker/br"], function() {
						element.datepicker({
							format: "dd/mm/yyyy",
							language: "pt-BR"
						});
					});
				}
			}
		};
	}]);
});