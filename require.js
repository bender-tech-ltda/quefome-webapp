var namespaces = require("./namespaces.js");

var $require = function(module) {
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

		return require(path.join(root, result));
	} else {
		return require(namespace);
	}
};

module.exports = $require;