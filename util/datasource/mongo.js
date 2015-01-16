var config = $require("config");

var Q = require("q");
var mongo = require("mongodb").MongoClient;

var connection = null;


var Mongo = function(config) {
	var connection = null;
	var connect = function() {
		if (!connection) {
			var deferred = Q.defer();
			mongo.connect(config.mongo.url, function(err, db) {
				if (err) {
					defaultReject(deferred, err);
				} else {
					deferred.resolve(db);
				}
			});

			return deferred.promise;
		} else {
			Q.fcall(function() {
				return connection;
			});
		}
	};

	var defaultReject = function(deferred, error) {
		deferred.reject({
			status: 500,
			body: err
		});
	};

	var defaultSuccess = function(deferred, data) {
		deferred.resolve({
			status: 200,
			body: data
		});
	}

	var save = function(collection, data) {
		return connect().then(function(db) {
			var deferred = Q.defer();
			db.collection(collection).save(data, function(err) {
				if (err) {
					defaultReject(deferred, err);
				} else {
					defaultSuccess(deferred, data);
				}
			});

			return deferred.promise;
		});
	};

	var insert = function(collection, data) {
		return connect().then(function(db) {
			var deferred = Q.defer();
			db.collection(collection).insert(data, function(err) {
				if (err) {
					defaultReject(deferred, err);
				} else {
					defaultSuccess(deferred, data);
				}
			});

			return deferred.promise;
		});
	};

	var update = function(collection, data) {
		return connect().then(function(db) {
			var deferred = Q.defer();
			db.collection(collection).update({_id: data._id}, data, function(err) {
				if (err) {
					defaultReject(deferred, err);
				} else {
					defaultSuccess(deferred, data);
				}
			});

			return deferred.promise;
		});
	};

	var remove = function(collection, id) {
		return connect().then(function(db) {
			var deferred = Q.defer();
			db.collection(collection).remove({_id: id}, function(err) {
				if (err) {
					defaultReject(deferred, err);
				} else {
					defaultSuccess(deferred, id);
				}
			});

			return deferred.promise;
		});
	};

	var list = function(collection, query) {
		return connect().then(function(db) {
			var deferred = Q.defer();
			db.collection(collection).find(query).toArray(function(err, list) {
				if (err) {
					defaultReject(deferred, err);
				} else {
					defaultSuccess(deferred, list);
				}
			});

			return deferred.promise;
		});
	};

	var get = function(collection, id) {
		return connect().then(function(db) {
			var deferred = Q.defer();
			db.collection(collection).find({_id: id}, {limit: 1}).toArray(function(err, list) {
				if (err) {
					defaultReject(deferred, err);
				} else {
					defaultSuccess(deferred, list ? list[0] : {});
				}
			});

			return deferred.promise;
		});
	};

	var parseParams = function(url) {
		url = url.replace(/^\//, "");
		var params = url.split("/");

		var result = {};
		result.collection = params[0];
		result.action = params[1] || false;
		result.query = params.length > 2 ? params.slice(2, params.length) : false;

		return result;
	};

	this._connect = connect;

	this.request = function(options) {
		var self = this;

		return Q.fcall(function() {
			method = options.method ? options.method.trim().toLowerCase() : "get";

			if (self[method]) {
				return self[method](options.url, options.body || options.qs, options);
			}

			throw {
				status: 404,
				body: "Not know method: " + method
			};
		});
	};

	this.get = function(url, query, options) {
		return Q.fcall(function() {
			var params = parseParams(url);

			if (params.action == "list") {
				return list(params.collection, query);
			} else if (params.action == "get" && params.query[0]) {
				return get(params.collection, params.query[0]);
			}

			throw {
				status: 404,
				body: "Don't know what to do with GET " + url
			};
		});
	};

	this.post = function(url, data, options) {
		return Q.fcall(function() {
			var params = parseParams(url);

			if (params.action == "save") {
				return save(params.collection, data);
			} else if (params.action == "insert") {
				return insert(params.collection, data);
			}

			throw {
				status: 404,
				body: "Don't know what to do with POST " + url
			};
		});
	};

	this.put = function(url, data, options) {
		return Q.fcall(function() {
			var params = parseParams(url);

			if (params.action == "save") {
				return save(params.collection, data);
			} else if (params.action == "update") {
				return update(params.collection, data);
			}

			throw {
				status: 404,
				body: "Don't know what to do with PUT " + url
			};
		});
	};

	this.delete = function(url, query, options) {
		return Q.fcall(function() {
			var params = parseParams(url);
			if ((params.action == "remove" || params.action == "delete") && params.query[0]) {
				return remove(params.collection, params.query[0]);
			}

			throw {
				status: 404,
				body: "Don't know what to do with DELETE " + url
			};
		});
	};

	this.head = function(url, data, options) {
		return Q.fcall(function() {
			throw {
				status: 404,
				body: "Don't know what to do with HEAD " + url
			};
		});
	};
};

module.exports = new Mongo(config);