define(["angular"], function(angular) {
	"use strict";
	
	var module = angular.module("qfAdminServices", []);

	var treatPromiseErrors = function($q) {
		return function(response) {
			if (response.status == 900 && typeof(response.data) === "object") {
				return $q.reject(response.data.message);
			} else {
				return $q.reject(false);
			}
		};
	};

	return module;
});