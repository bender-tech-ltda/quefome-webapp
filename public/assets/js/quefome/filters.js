define(["angular"], function(angular) {
	"use strict";

	var module = angular.module("qfFilters", []);

	module.filter("prettyTime", ["$filter", function($filter) {
		return function(value, today) {
			if (!value) {
				return "";
			}

			if (!today) {
				today = new Date();
			}

			var date = (value instanceof Date) ? value : new Date(value);
			var result = $filter("date")(date, "HH:mm");

			if (date.getDate() != today.getDate()) {
				result += " do dia " + $filter("date")(date, "dd/MM");
			}

			return result;
		};
	}]);

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

	module.filter("orderStatusDescription", [function() {
		return function(status) {
			if (typeof(status) === "object") {
				status = status.status;
			}

			if (status == "OPEN") {
				return "O estabelecimento já recebeu seu pedido!";
			} else if (status == "PRODUCTION") {
				return "O seu pedido está sendo preparado!";
			} else {
				return "O seu pedido já foi entregue!";
			}
		};
	}]);

	module.filter("phone", [function() {
		return function(phone) {
			if (!phone) {
				return "";
			}

			var onlyDigitsPhone = phone.trim().replace(new RegExp("[^0-9]", "g"), "");

			if (onlyDigitsPhone.length < 8) {
				return phone;
			} else if (onlyDigitsPhone.length <= 9) {
				return onlyDigitsPhone.substr(0, 4) + "-" + onlyDigitsPhone.substr(4);
			} else if (onlyDigitsPhone.length <= 11) {
				return "(" + onlyDigitsPhone.substr(0, 2) + ") " + onlyDigitsPhone.substr(2, 4) + "-" + onlyDigitsPhone.substr(6);
			} else if (onlyDigitsPhone.length <= 13 && onlyDigitsPhone.substr(0, 2) == "55") {
				return "(" + onlyDigitsPhone.substr(2, 2) + ") " + onlyDigitsPhone.substr(4, 4) + "-" + onlyDigitsPhone.substr(8);
			} else {
				return phone;
			}
		};
	}]);

	module.filter("groupProductList", ["$filter", function($filter) {
		var groupProductsById = function(products) {
			var productsByIdObject = {};
			var productResultList = [];

			for (var i in products) {
				var product = products[i];

				var item = null;

				if (product.product) {
					item = product;
					product = item.product;
				}

				var groupObject = null;

				if (!productsByIdObject[product.id]) {
					groupObject = angular.copy(product);
					groupObject.quantity = 0;

					productsByIdObject[product.id] = groupObject;
					productResultList.push(groupObject);
				} else {
					groupObject = productsByIdObject[product.id];
				}

				if (item && item.quantity && item.quantity > 0) {
					groupObject.quantity += item.quantity;
				} else {
					groupObject.quantity++;
				}
			}

			return productResultList;
		};

		var orderProducts = function(products) {
			return $filter("orderBy")(products, "id");
		};

		var transformGrouppedProductsListToObject = function(products, limit) {
			var resultObject = {
				productsString: "",
				size: products.length
			};

			if (!limit || limit > products.length) {
				limit = products.length;
			}

			for (var i in products) {
				var product = products[i];
				resultObject.productsString += (product.name + " (" + product.quantity + ")");

				//nao entendi pq tive que usar parseInt
				//se nao fizesse, o 'i' era concatenado com '1'
				var position = (parseInt(i) + 1);

				if (position >= limit) {
					break;
				} else if (position < limit) {
					resultObject.productsString += ", ";
				}
			}

			return resultObject;
		};

		return function(products, limit) {
			if (!(products instanceof Array) && typeof(products) === "object") {
				products = products.items;
			}

			var productsGrouppedById = groupProductsById(products);
			productsGrouppedById = orderProducts(productsGrouppedById)

			return transformGrouppedProductsListToObject(productsGrouppedById, limit);
		};
	}]);
});