define(["angular", "angular/analytics"], function(angular) {
	"use strict";
	
	var module = angular.module("qfAdminServices", ["angulartics"]);

	var treatPromiseErrors = function($q) {
		return function(response) {
			if (response.status == 900 && typeof(response.data) === "object") {
				return $q.reject(response.data.message);
			} else {
				return $q.reject(false);
			}
		};
	};

	module.service("PrintService", ["$http", "$q", "$timeout", "$document", function($http, $q, $timeout, $document) {
		var document = $document[0];

		var printContent = function(title, content) {
			var html = [];
			html.push("<html>");
			html.push("<head>");
			html.push("<meta charset='utf-8' />");
			html.push("<title>" + (title || "Quefo.me") + "</title>");
			html.push("</head>");
			html.push("<body>");
			html.push(content);
			html.push("<script type='text/javascript'>")
			html.push("function printPage(callback) {window.focus();window.print();callback();}");
			html.push("</script");
			html.push("></body>");
			html.push("</html>");

			var iframe = document.createElement("iframe");
			iframe.src = "about:blank";
			iframe.style.display = "none";

			document.body.appendChild(iframe);

			var iframeDocument = (iframe.contentWindow ? iframe.contentWindow.document : iframe.contentDocument);
			iframeDocument.open();
			iframeDocument.write(html.join(""));

			var printPage = function() {
				if (!iframe.contentWindow || !iframe.contentWindow.printPage) {
					$timeout(printPage, 50);
					return;
				}

				iframe.contentWindow.printPage(function() {
					iframeDocument.close();
					iframe.remove();
				});	
			};

			printPage();
		};

		this.print = function(options) {
			if (typeof(options) === "undefined") {
				throw "You need to pass an URL for print";
			} else if (typeof(options) === "string") {
				options = {
					url: options
				};
			}

			if (!options.method) {
				options.method = "get";
			}

			if (!options.title) {
				options.title = "Quefo.me";
			}

			return $http(options).then(function(response) {
				var content = response.data;
				printContent(options.title, content);

				return content;
			}, treatPromiseErrors($q));
		};
	}]);

	module.service("AuthService", ["$http", "$q", "$analytics", function($http, $q, $analytics) {
		var loggedUser = null;

		this.isLogged = function() {
			return !!loggedUser;
		};

		this.getUser = function() {
			return loggedUser;
		};

		var setLoggedUser = function(user) {
			loggedUser = user;
			$analytics.setUsername(user && user.email ? user.email : null);
		};

		this.__setLoggedUser = setLoggedUser;

		this.login = function(email, password, keepLoggedIn) {
			var params = {
				password: password,
				keepLoggedIn: keepLoggedIn ? keepLoggedIn : false
			};

			return $http.get("/api/establishment-users/auth/login/" + email + "/", {params: params}).then(function(response) {
				setLoggedUser(response.data);
				return response.data
			}, treatPromiseErrors($q));
		};

		this.logout = function() {
			return $http.delete("/api/establishment-users/auth/logout/").then(function() {
				setLoggedUser(null);
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

			return $http.get("/api/establishment-users/auth/retrieve/").then(function(response) {
				setLoggedUser(response.data ? response.data : null);

				isCheckingForLoggedUser = false;
				hasCheckedForLoggedUser = true;

				return response.data;
			}, function(response) {
				setLoggedUser(null);

				isCheckingForLoggedUser = false;
				hasCheckedForLoggedUser = true;
			});
		};
	}]);

	module.service("OrderService", ["$http", "$q", "PrintService", function($http, $q, PrintService) {
		this.list = function(filter) {
			if (filter) {
				filter = angular.copy(filter);
				
				if (filter.fromDate instanceof Date) {
					filter.fromDate = filter.fromDate.getTime();
				}

				if (filter.toDate instanceof Date) {
					filter.toDate = filter.toDate.getTime();
				}
			}

			return $http.get("/api/establishment/orders/", {params: filter}).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};

		this.changeStatus = function(order, status) {
			order = angular.copy(order);
			order.status = status;

			return $http.put("/api/orders/" + order.id + "/status/", order).then(function(response) {
				return response.data;
			}, treatPromiseErrors($q));
		};

		this.print = function(order) {
			return PrintService.print({
				url: ("/admin/orders/" + order.id + "/print/"),
				method: "post",
				data: order
			});
		};
	}]);

	module.factory("AnalyticsErrorReportHttpInterceptor", ["$q", "$analytics", function($q, $analytics) {
		return {
			responseError: function(response) {
				var isBusinessError = function() {
					return response.status >= 900 && response.status < 1000
				};

				try {
					if (!isBusinessError()) {
						var errorObject = {
							url: response.config.url,
							method: response.config.method,
							status: response.status,
							body: response.data
						};

						$analytics.eventTrack("Ajax Request Error", {
							category: 'Error',
							label: angular.toJson(errorObject, true),
							nonInteraction: true
						});
					}
				} catch (e) {}

				return $q.reject(response);
			}
		};
	}]);

	module.config(["$httpProvider", function($httpProvider) {
		$httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
		$httpProvider.defaults.headers.common["X-User-Accept"] = $httpProvider.defaults.headers.common["Accept"];

		$httpProvider.interceptors.push('AnalyticsErrorReportHttpInterceptor');
	}]);

	return module;
});