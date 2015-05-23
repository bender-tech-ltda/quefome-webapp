define(["angular", "quefome/filters"], function(angular) {
	"use strict";

	var module = angular.module("qfAdminFilters", ["qfFilters"]);

	module.filter("orderStatus", [function() {
		return function(status) {
			if (typeof(status) === "object") {
				status = status.status;
			}

			if (status == "OPEN") {
				return "Aberto";
			} else if (status == "PRODUCTION") {
				return "Em Produção";
			} else {
				return "Entregue";
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