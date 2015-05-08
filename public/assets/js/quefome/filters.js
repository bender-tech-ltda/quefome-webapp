define(["angular"], function(angular) {
	"use strict";

	var module = angular.module("qfFilters", []);

	module.filter("money", ["$filter", function($filter) {
		return function(value) {
			if (typeof(value) === "undefined") {
				return "";
			}

			if (!value) {
				value = 0;
			}

			if (typeof(value) === "number") {
				value = value.toFixed(2);
			}

			return value.replace(",", "").replace(".", ",");
		};
	}]);

	module.filter("establishmentStatus", [function() {
		return function(establishment) {
			var status = establishment;

			if (typeof(establishment) === "object") {
				if (establishment.status) {
					status = establishment.status;
				} else if (establishment.parameters) {
					status = establishment.parameters.status;
				} else {
					status = '';
				}
			}

			if (status == "OPEN") {
				return "Aberto";
			} else {
				return "Fechado";
			}
		};
	}]);

	module.filter("establishmentSchedule", ["$filter", function($filter) {
		return function(establishment, today) {
			if (!establishment || !establishment.parameters || !establishment.parameters.currentSchedule) {
				return "";
			}

			if (!today || !(today instanceof Date)) {
				today = new Date();
			}

			var status = establishment.parameters.status;
			var schedule = establishment.parameters.currentSchedule;

			if (status == 'OPEN') {
				return $filter("date")(schedule.openingTime, "HH:mm") + " até " + $filter("date")(schedule.closingTime, "HH:mm");
			}

			var weekDayName = schedule.weekDay.name;
			if (schedule.weekDay.number == today.getDay()) {
				var openingTime = new Date(schedule.openingTime);

				if (today.getHours() < openingTime.getHours() ||
					(today.getHours() == openingTime.getHours() && today.getMinutes() < openingTime.getMinutes())) {
					weekDayName = "hoje";
				}
			} else {
				var daysUntilWeekDay = schedule.weekDay.number - today.getDay();

				if (daysUntilWeekDay < 0) {
					daysUntilWeekDay += 7;
				}

				if (daysUntilWeekDay == 1) {
					weekDayName = "amanhã";	
				}
			}

			return "Abrirá " + weekDayName + ", às " + $filter("date")(schedule.openingTime, "HH:mm");
		};
	}]);

	module.filter("establishmentDeliveryTime", [function() {
		return function(establishment) {
			if (!establishment || !establishment.parameters) {
				return "";
			}

			var parameters = establishment.parameters;
			if (parameters.minimumDeliveryTime && !parameters.maximumDeliveryTime) {
				return parameters.minimumDeliveryTime + "min."
			} else if (!parameters.minimumDeliveryTime && parameters.maximumDeliveryTime) {
				return parameters.maximumDeliveryTime + "min.";
			} else if (!parameters.minimumDeliveryTime && !parameters.maximumDeliveryTime) {
				return "0min."
			} else if (parameters.minimumDeliveryTime == parameters.maximumDeliveryTime) {
				return parameters.minimumDeliveryTime + "min."
			} else {
				return parameters.minimumDeliveryTime + " à " + parameters.maximumDeliveryTime + "min.";
			}
		};
	}]);
});