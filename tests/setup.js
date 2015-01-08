$require = require("../require.js");

jasmine.Matchers.prototype.toBeEmpty = function() {
	if (typeof(this.actual) === "undefined") {
		return true;
	} else if (typeof(this.actual) === "string") {
		return this.actual.trim().length === 0;
	} else if (typeof(this.actual) === "object") {
		return this.actual.length === 0;
	}

	return this.actual == null;
};

jasmine.Matchers.prototype.toBeString = function() {
	return typeof(this.actual) === "string";
};

jasmine.Matchers.prototype.toBeFunction = function() {
	return typeof(this.actual) === "function";
};

jasmine.Matchers.prototype.toBeObject = function() {
	return typeof(this.actual) === "object";
};

module.exports = jasmine;