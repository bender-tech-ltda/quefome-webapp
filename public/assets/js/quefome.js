"use strict";

define(["angular", "quefome/config", "quefome/run", "quefome/services" ,"quefome/controllers", "angular/route"], function(angular, config, run) {
	var quefome = angular.module("quefome", ["ngRoute", "qfServices", "qfControllers"]);
	quefome.config(config);
	quefome.run(run);

	return quefome;
});