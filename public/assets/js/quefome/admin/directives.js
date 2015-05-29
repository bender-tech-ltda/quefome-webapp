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

	module.directive("input", ["$filter", function($filter) {
		return {
			require: "ngModel",
			restrict: "E",
			link: function(scope, element, attrs, ngModelController) {
				if (element.attr("type") != "date") {
					return;
				}

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

				var applyDatepickerSorcery = function() {
					/**
					var convertToDate = function(date) {
						try {
							if (!(date instanceof Date)) {
								date = new Date(date);
							}

							if (isNaN(date)) {
								return null;
							}

							return date;
						} catch (e) {
							return null;
						}
					}

					var stringToDate = function(stringDate) {
						if (!stringDate) {
							return null;
						}

						var date = convertToDate(stringDate);
						if (date) {
							return date;
						}

						stringDate = stringDate.replace(new RegExp("[^0-9]", "g"), "");

						if (stringDate.length < 8) {
							return null;
						}

						var day = stringDate.substr(0, 2);
						var month = stringDate.substr(2, 2);
						var year = stringDate.substr(4, 4);

						return convertToDate(year + "-" + month + "-" + day);
					};

					ngModelController.$parsers.push(function(value) {
						ngModelController.$setValidity("date", true);
						return new Date();
					});
					**/


					var cssDatePicker = document.getElementById("cssDatePicker.qfInputDate");

					if (!cssDatePicker) {
						cssDatePicker = document.createElement("link");
						cssDatePicker.id = "cssDatePicker.qfInputDate";
						cssDatePicker.type = "text/css";
						cssDatePicker.rel = "stylesheet";
						cssDatePicker.href = "/components/bootstrap-datepicker/dist/css/bootstrap-datepicker3.min.css";

						document.getElementsByTagName("head")[0].appendChild(cssDatePicker);
					}

					require(["bootstrap/datepicker/br"], function() {
						element.attr("type", "text");

						element.datepicker({
							format: "yyyy-mm-dd",
							language: "pt-BR"
						});
					});
				};

				if (!browserSupportsDateInput() || !browserDisplaysDatePicker()) {
					applyDatepickerSorcery();
				}
			}
		};
	}]);
});