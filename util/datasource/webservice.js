var Q = require("q");
var request = require("request");

var WebService = function(config) {
	if (!config) {
		config = {};
	}

	this.setConfig = function(c) {
		config = c;
	};

	var methodHasBody = function(method) {
		method = method ? method.trim().toLowerCase() : "";
		return ["post", "put"].indexOf(method) >= 0;
	}

	var doRequest = function(method, url, data, options) {
		if (!options) {
			options = {};
		}

		if (!options.method) {
			options.method = method ? method : "get";
		}

		if (!options.url && url) {
			options.url = url;
		}

		if (config.baseUrl) {
			if (!options.url) {
				options.url = config.baseUrl;
			} else if (!options.url.match(/^http.*/)) {
				options.url = (config.baseUrl.replace(/\/$/, "") + "/" + options.url.replace(/^\//, ""));
			}	
		}

		if (data) {
			if (methodHasBody(options.method)) {
				options.body = data;
				options.json = typeof(data) === "object";
			} else {
				options.qs = data;
			}
		}

		var deferred = Q.defer();

		var httpRequest = request(options, function(error, response, body) {
			if (error || !response || response.statusCode != 200) {
				console.error({
					url: options.url,
					method: options.method,
					status: (response && response.statusCode),
					body: body
				});

				if (error) {
					console.error(error);
				}

				deferred.reject(response, httpRequest);
				return;
			}

			deferred.resolve(response, httpRequest);
		});

		deferred.promise.request = httpRequest;
		return deferred.promise;
	};

	this.request = function(options) {
		return doRequest(null, null, null, options);
	};

	this.get = function(url, query, options) {
		return doRequest("get", url, query, options);
	};

	this.post = function(url, data, options) {
		return doRequest("post", url, data, options);
	};

	this.put = function(url, data, options) {
		return doRequest("put", url, data, options);
	};

	this.delete = function(url, query, options) {
		return doRequest("delete", url, query, options);
	};

	this.head = function(url, data, options) {
		return doRequest("head", url, data, options);
	};

};

module.exports = new WebService();