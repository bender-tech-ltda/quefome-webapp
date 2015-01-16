var config = $require("config");

var mongo = require("mongodb").MongoClient;
var connection = null;

module.exports = {
	do: function(callback) {
		if (typeof(callback) !== "function") {
			callback = function() {};
		}

		if (!connection) {
			mongo.connect(config.mongo.url, function(err, db) {
				if (err) {
					console.log("Erro ao conectar ao servidor do mongo: " + config.mongo.url);
					console.dir(err);
					return;
				}

				connection = db;
				callback(err, connection);
			});
		} else {
			callback(null, connection);
		}
	}
};