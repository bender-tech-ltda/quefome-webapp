util.Object = {
	extends: function(parentPrototype, childPrototype) {
		if (util.Object.inherits(parentPrototype, childPrototype)) {
			return;
		}

		var constructor = childPrototype.prototype ? childPrototype.prototype.constructor : childPrototype.constructor;

		constructor.prototype = new parentPrototype;
		constructor.prototype.constructor = constructor;
		constructor.prototype.super = parentPrototype.prototype;
	},

	inherits: function(parentPrototype, childPrototype) {
		var constructor = childPrototype.prototype ? childPrototype.prototype.constructor : childPrototype.constructor;
		return constructor.prototype.super && constructor.prototype.super.constructor == parentPrototype.prototype.constructor;
	},

	copy: function(sourceObject, destObject, deep) {
		if (!deep) {
			deep = 100;
		}

		if (!destObject) {
			destObject = {};
		}

		for (var property in sourceObject) {
			if (sourceObject.hasOwnProperty(property)) {
				var value = sourceObject[property];

				if (typeof(value) === "object" && deep > 0) {
					destObject[property] = util.Object.copy(value, {}, deep-1);
				} else {
					destObject[property] = value;
				}
			}
		}

		return destObject;
	}
};

module.exports = util;