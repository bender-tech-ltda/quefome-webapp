var Q = require("q");
var request = require("request");

var defaultConfig = $require("config").integration.webservice;

var WebService = function(config) {
	if (!config) {
		config = defaultConfig;
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
				var url = "";
				var paths = options.url.split("/");
				for (var i in paths) {
					var path = paths[i];
					url += encodeURI(path);

					if (i < (paths.length-1)) {
						url += "/";
					}
				}

				options.url = (config.baseUrl.replace(/\/$/, "") + "/" + url.replace(/^\//, ""));
			}	
		}

		console.log(options.url);

		if (data) {
			if (methodHasBody(options.method)) {
				options.body = data;
			} else {
				options.qs = data;
			}
		}

		if (typeof(options.body) === "object") {
			options.json = options.body;
			delete(options.body)
		}

		var deferred = Q.defer();

		try {
			var httpRequest = request(options, function(error, response, body) {
				if (error || !response || response.statusCode != 200) {
					if (!response) {
						response = {
							url: options.url,
							method: options.method,
							statusCode: 404,
							body: body || ""
						};
					}

					console.error(response);

					if (error) {
						console.error(error);
					}

					deferred.reject(response, httpRequest);
					return;
				}

				//contorno para caso o JSON venha como uma string
				if (response.body && typeof(response.body) === "string") {
					try {
						response.body = JSON.parse(response.body);
					} catch(ex) {}
				}

				deferred.resolve(response, httpRequest);
			});

			deferred.promise.request = httpRequest;
		} catch (error) {
			console.log(error);
			throw error;
		}
		
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