define(["angular"], function(angular) {
	"use strict";
	
	var module = angular.module("qfServices", []);

	var treatPromiseErrors = function($q) {
		return function(response) {
			if (response.status == 900 && typeof(response.data) === "object") {
				return $q.reject(response.data.message);
			} else {
				return $q.reject(false);
			}
		};
	};

	var simplifyAddressObject = function(address) {
		var simplifiedAddress = {};

		if (address) {
			simplifiedAddress.zipCode = address.zipCode;
			simplifiedAddress.address = address.address;
			simplifiedAddress.neighborhood = typeof(address.neighborhood) === "object" ? address.neighborhood.name : address.neighborhood;
			simplifiedAddress.city = typeof(address.city) === "object" ? address.city.name : address.neighborhood;
			simplifiedAddress.state = typeof(address.city) === "object" ? (typeof(address.city.state) === "object" ? address.city.state.acronym : address.city.state) : address.state;
		}

		return simplifiedAddress;
	};

	module.service("$localStorage", [function() {
		var localStorage = window.localStorage;

		this.__setLocalStorage = function(_localStorage) {
			localStorage = _localStorage;
		}

		this.set = function(key, value) {
			var serializedValue = JSON.stringify(value);
			localStorage.setItem(key, serializedValue);
		};

		this.get = function(key) {
			var value = localStorage.getItem(key);

			if (value) {
				return JSON.parse(value);
			}

			return false;
		};
	}]);

	module.service("AuthService", ["$http", "$q", function($http, $q) {
		var loggedUser = null;

		this.isLogged = function() {
			return !!loggedUser;
		};

		this.getUser = function() {
			return loggedUser;
		};

		this.__setLoggedUser = function(user) {
			loggedUser = user;
		};

		this.login = function(email, password, keepLoggedIn) {
			var params = {
				password: password,
				keepLoggedIn: keepLoggedIn ? keepLoggedIn : false
			};

			return $http.get("/api/users/auth/login/" + email + "/", {params: params}).then(function(response) {
				loggedUser = response.data;
				return response.data
			}, treatPromiseErrors($q));
		};

		this.logout = function() {
			return $http.delete("/api/users/auth/logout/").then(function() {
				loggedUser = null
			});
		};

		var hasCheckedForLoggedUser = false;
		this.hasCheckedForLoggedUser = function() {
			return hasCheckedForLoggedUser;
		};

		var isCheckingForLoggedUser = false;
		this.isCheckingForLoggedUser = function() {
			return isCheckingForLoggedUser;
		};

		this.checkForLoggedUser = function() {
			isCheckingForLoggedUser = true;

			return $http.get("/api/users/auth/retrieve/").then(function(response) {
				if (response.data) {
					loggedUser = response.data;
				} else {
					loggedUser = null;
				}

				isCheckingForLoggedUser = false;
				hasCheckedForLoggedUser = true;

				return response.data;
			}, function() {
				loggedUser = null;

				isCheckingForLoggedUser = false;
				hasCheckedForLoggedUser = true;
			});
		};
	}]);
	
	module.service("UserService", ["$http", "$q", "AuthService", function($http, $q, AuthService) {
		this.save = function(user, login) {
			var params = {
				login: login
			};

			return $http.post("/api/users/", user, {params: params}).then(function(response) {
				var user = response.data;

				AuthService.__setLoggedUser(user);
				return user;
			}, treatPromiseErrors($q));
		};
	}]);

	module.service("ProductTypeService", ["$http", "$q", function($http, $q) {
		this.list = function() {
			return $http.get("/api/product-types/").then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};
	}]);

	module.service("EstablishmentService", ["$http", "$q", function($http, $q) {
		this.list = function(query) {
			if (query) {
				query = angular.copy(query);

				if (query.query) {
					query.q = query.query;
					delete(query.query);
				}
			}

			return $http.get("/api/establishments/", {params: query}).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};

		this.names = function(query, limit) {
			var params = {};

			if (query) {
				params.q = query;
			}

			if (limit) {
				params.limit = limit;
			}

			return $http.get("/api/establishments/names/", {params: params}).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};

		this.findByUrl = function(url) {
			return $http.get("/api/establishments/" + url).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};

		this.isAttendingAddress = function(establishment, address) {
			establishment = typeof(establishment) === "object" ? establishment.id : establishment;
			address = simplifyAddressObject(address);

			var url = "/api/establishments/" + establishment + "/attend-address/";
			url += address.zipCode + "/" + address.address + "/" + address.neighborhood + "/" + address.city + "/" + address.state + "/";

			return $http.get(url).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};

		this.products = function(establishment) {
			establishment = typeof(establishment) === "object" ? establishment.id : establishment;

			return $http.get("/api/establishments/" + establishment + "/products/").then(function(response) {
				return response.data;
			});
		};
	}]);

	module.service("PaymentMethodService", ["$http", "$q", function($http, $q) {
		this.list = function() {
			return $http.get("/api/payment-methods/").then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};
	}]);

	module.service("NeighborhoodService", ["$http", "$q", function($http, $q) {
		this.list = function() {
			return $http.get("/api/neighborhoods/").then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};
	}]);

	module.service("AddressService", ["$http", "$q", function($http, $q) {
		this.searchZipCode = function(zipCode) {
			zipCode = zipCode ? zipCode.trim().replace(/[^0-9]/g, "") : "";

			return $http.get("/api/addresses/search/zip-code/" + zipCode).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};

		this.searchAddress = function(address) {
			address = simplifyAddressObject(address);

			var url = "/api/addresses/search/address/";
			url += address.state + "/" + address.city + "/" + address.address;

			return $http.get("/api/addresses/search/address/" + address.state + "/" + address.city + "/" + address.address).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));

		};

		var currentAddress = null;

		this.getCurrentAddress = function() {
			return currentAddress;
		};

		this.setCurrentAddress = function(address) {
			currentAddress = address;
		};
	}]);

	module.service("OrderService", ["$localStorage", function($localStorage) {
		this.store = function(order) {
			var establishment = typeof(order.establishment) === "object" ? order.establishment.id : order.establishment;
			$localStorage.set("OrderService_store_" + establishment, order);
		};

		this.retrieve = function(establishment) {
			establishment = typeof(establishment) === "object" ? establishment.id : establishment;
			return $localStorage.get("OrderService_store_" + establishment);
		};

		this.getOrderPrice = function(order) {
			if (!order || !order.items) {
				return false;
			}

			var total = 0;

			for (var itemIndex in order.items) {
				var item = order.items[itemIndex];
				total += this.getOrderItemPrice(item);
			}

			return total;
		};

		this.getOrderItemPrice = function(orderItem) {
			var total = (orderItem.product ? orderItem.product.price : 0.0);

			if (orderItem.flavors && orderItem.flavors.length > 0) {
				for (var flavorIndex in orderItem.flavors) {
					var flavor = orderItem.flavors[flavorIndex];
					total += (flavor.price ? flavor.price : 0.0);
				}
			}

			if (orderItem.components && orderItem.components.length > 0) {
				for (var componentIndex in orderItem.components) {
					var itemComponent = orderItem.components[componentIndex];

					if (itemComponent.component && itemComponent.value) {
						total += (itemComponent.component.price ? itemComponent.component.price : 0.0);
					} else if (itemComponent.selectedOption) {
						total += (itemComponent.selectedOption.price ? itemComponent.selectedOption.price : 0.0);
					}
				}
			}

			return total;
		};
	}]);

	return module;
});