var namespaces = require("./namespaces.js");
var path = require("path");

var DIR = path.join(__dirname, "../..");

var $require = function(namespace) {
	var result = null;

	if (namespaces[namespace]) {
		result = namespaces[namespace];
	} else {
		for (var i in namespaces) {
			if (new RegExp(i).test(namespace)) {
				result = (namespaces[namespace] = namespaces[i]);
				break;
			}
		}
	}

	if (result) {
		if (typeof(result) === "function") {
			result = result(namespace);
		}

		return require(path.join(DIR, result));
	} else {
		return require(namespace);
	}
};

module.exports = $require;