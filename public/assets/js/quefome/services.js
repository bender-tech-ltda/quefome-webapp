define(["angular"], function(angular) {
	"use strict";
	
	var module = angular.module("qfServices", []);

	var treatPromiseErrors = function($q) {
		return function(response) {
			var statusObject = {
				status: response.status,
				message: response.data,
				isBusinessError: false,
				isNotFoundError: false,
				isError: false
			};

			if (response.status == 900) {
				statusObject.isBusinessError = true;
				statusObject.message = "";

				if (typeof(response.data) === "object") {
					statusObject.message = response.data.message;
				}
			} else if (response.status == 404) {
				statusObject.isNotFoundError = true;
			} else {
				statusObject.isError = true;
			}

			return $q.reject(statusObject);
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

	module.service("$flashStorage", [function() {
		var sessionStorage = {
			_items: {},

			setItem: function(key, value) {
				this._items[key] = value;
			},

			getItem: function(key) {
				return this._items[key];
			},

			removeItem: function(key) {
				if (this._items[key]) {
					delete(this._items[key]);
				}
			}
		};

		this.__setSessionStorage = function(_sessionStorage) {
			sessionStorage = _sessionStorage;
		}

		this.set = function(key, value) {
			sessionStorage.setItem(key, value);
		};

		this.get = function(key, dontDeleteYet) {
			var value = sessionStorage.getItem(key);

			if (typeof(value) != "undefined" && !dontDeleteYet) {
				this.remove(key);
			}

			return value;
		};

		this.remove = function(key) {
			sessionStorage.removeItem(key);
		};
	}]);

	module.service("$localStorage", [function() {
		var toBase64 = window.btoa;
		var fromBase64 = window.atob;

		var encodeURIComponent = window.encodeURIComponent;
		var decodeURIComponent = window.decodeURIComponent;

		var jsonStringify = JSON.stringify;
		var jsonParse = JSON.parse;

		var stringify = function(value) {
			if (typeof(toBase64) === "function") {
				return toBase64(encodeURIComponent(JSON.stringify(value)));
			}

			return encodeURIComponent(jsonStringify(value));
		};

		var parse = function(value) {
			if (typeof(fromBase64) === "function") {
				return jsonParse(decodeURIComponent(fromBase64(value)));
			}

			return jsonParse(decodeURIComponent(value));
		};

		var localStorage = window.localStorage;

		this.__setLocalStorage = function(_localStorage) {
			localStorage = _localStorage;
		}

		this.set = function(key, value) {
			var storedValue = this.get(key);

			if (!storedValue || !storedValue.__localStorageObject) {
				storedValue = {
					__localStorageObject: true,
					created: new Date(),
					updated: new Date()
				};
			} else {
				storedValue.updated = new Date();
			}

			storedValue.value = value;

			localStorage.setItem(stringify(key), stringify(storedValue));
		};

		this.get = function(key) {
			var value = localStorage.getItem(stringify(key));

			if (!value) {
				return false;
			}

			try {
				var storedValue = parse(value);
			} catch(e) {
				return false;
			}

			if (!storedValue.__localStorageObject) {
				return storedValue;
			}

			if (storedValue.created) {
				try {
					storedValue.created = new Date(storedValue.created);
				} catch(e) {}
			}

			if (storedValue.updated) {
				try {
					storedValue.updated = new Date(storedValue.updated);
				} catch(e) {}
			}

			return storedValue;
		};

		this.remove = function(key) {
			localStorage.removeItem(key);
		};
	}]);

	module.service("$notification", ["$q", function($q) {
		var Notification = window.Notification;

		this.__setNotification = function(_Notification) {
			Notification = _Notification;
		};

		var Notify = function(title, message, show) {
			this.options = {};

			if (typeof(title) === "object") {
				this.options = title;
			} else if (typeof(message) === "object") {
				this.options = message;
			}

			if (typeof(show) === "undefined") {
				show = true;
			}

			if (typeof(this.options.title) !== "undefined") {
				this.title = this.options.title;
				delete(this.options.title);
			} else if (typeof(title) === "string") {
				this.title = title;
			}

			if (typeof(this.options.message) !== "undefined") {
				this.options.body = this.options.message;
				delete(this.options.message);
			} else if (typeof(message) === "string") {
				this.options.body = message;
			}

			if (typeof(this.options.show) !== "undefined") {
				show = this.options.show;
				delete(this.options.show);
			}

			if (!this.options.lang) {
				this.options.lang = "pt-BR";
			}

			if (!this.options.icon) {
				this.options.icon = "/assets/img/quefome_icon_70x75.png";
			}

			if (show) {
				this.show();
			}
		};

		Notify.prototype.title = "";
		Notify.prototype.options = null;

		Notify.prototype._currentNotification = null;
		Notify.prototype.show = function() {
			if (!Notification) {
				return;
			}

			this.hide();

			this._currentNotification = new Notification(this.title, this.options);
			return this._currentNotification;
		};

		Notify.prototype.hide = function() {
			if (this._currentNotification) {
				this._currentNotification.close();
			}
		};

		this.requestPermission = function() {
			if (!Notification || this.hasPermission()) {
				return $q(function(resolve, reject) {
					if (!Notification) {
						reject();
					} else {
						resolve();
					}
				});
			}

			var deferred = $q.defer();
			var that = this;

			Notification.requestPermission(function(permission) {
				if (that.hasPermission()) {
					deferred.resolve();
				} else {
					deferred.reject();
				}
			});

			return deferred.promise;
		};

		this.hasPermission = function() {
			return Notification && Notification.permission == "granted" ? true : false;
		};

		this.notify = function(title, message, show) {
			return new Notify(title, message, show);
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

	module.service("AddressService", ["$http", "$q", "$localStorage", function($http, $q, $localStorage) {
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
			var storedObject = $localStorage.get("AddressService_currentAddress");

			if (!storedObject || !storedObject.__localStorageObject || !(storedObject.updated instanceof Date)) {
				return false;
			}
			
			var oneHourAgoDate = new Date();
			
			var oneHoursInMilliseconds = (1 * 1000 * 60 * 60);
			oneHourAgoDate.setTime(oneHourAgoDate.getTime() - oneHoursInMilliseconds);
			
			if (oneHourAgoDate.getTime() >  storedObject.updated.getTime()) {
				return false;
			}

			return storedObject.value;
		};

		this.setCurrentAddress = function(address) {
			$localStorage.set("AddressService_currentAddress", address);
		};
	}]);

	module.service("OrderService", ["$http", "$q", "$localStorage", function($http, $q, $localStorage) {
		var that = this;

		this.create = function(order) {
			return $http.post("/api/user/orders/", order).then(function(response) {
				that.remove(order);

				return response.data;
			},treatPromiseErrors($q));
		};

		this.list = function() {
			return $http.get("/api/user/orders/").then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};

		this.store = function(order) {
			var establishment = order.establishment && typeof(order.establishment) === "object" ? order.establishment.id : order.establishment;
			$localStorage.set("OrderService_store_" + establishment, order);
		};

		this.retrieve = function(establishment) {
			establishment = establishment && typeof(establishment) === "object" ? establishment.id : establishment;
			var storedObject = $localStorage.get("OrderService_store_" + establishment);

			if (!storedObject || !storedObject.__localStorageObject || !(storedObject.updated instanceof Date)) {
				return false;
			}
			
			var oneHourAgoDate = new Date();
			
			var oneHoursInMilliseconds = (1 * 1000 * 60 * 60);
			oneHourAgoDate.setTime(oneHourAgoDate.getTime() - oneHoursInMilliseconds);
			
			if (oneHourAgoDate.getTime() >  storedObject.updated.getTime()) {
				$localStorage.remove("OrderService_store_" + establishment);
				return false;
			}

			return storedObject.value;
		};

		this.remove = function(order) {
			var establishment = order.establishment && typeof(order.establishment) === "object" ? order.establishment.id : order.establishment;
			$localStorage.remove("OrderService_store_" + establishment);
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

			if (!order.withdraw && order.establishment && order.establishment.parameters) {
				total += (order.establishment.parameters.deliverTax ? order.establishment.parameters.deliverTax : 0.0);
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

			if (typeof(orderItem.quantity) === "undefined") {
				orderItem.quantity = 1;
			}

			total = (total * orderItem.quantity);

			return total;
		};
	}]);

	return module;
});