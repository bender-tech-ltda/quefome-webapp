Object.prototype.extends = function(prototype) {
	if (this.inherits(prototype)) {
		return;
	}

	var constructor = this.prototype ? this.prototype.constructor : this.constructor;

	constructor.prototype = new prototype;
	constructor.prototype.constructor = constructor;
	constructor.prototype.super = prototype.prototype;
};

Object.prototype.inherits = function(prototype) {
	var constructor = this.prototype ? this.prototype.constructor : this.constructor;
	return constructor.prototype.super && constructor.prototype.super.constructor == prototype.prototype.constructor;
};

Object.prototype.copy = function(destObject, deep) {
	deep = 100, destObject = {};

	if (typeof(arguments[0]) === "number") {
		deep = arguments[0];
	} else if (typeof(arguments[1]) === "number") {
		deep = arguments[1];
	}

	if (typeof(arguments[0]) === "object") {
		destObject = arguments[0];
	} else if (typeof(arguments[1]) === "object") {
		destObject = arguments[1];
	}

	for (var property in this) {
		if (this.hasOwnProperty(property)) {
			destObject[property] = this[property];
		}
	}

	return destObject;
};