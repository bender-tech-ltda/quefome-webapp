"use strict";

define(["angular", "quefome/config", "quefome/run", "quefome/controllers", "angular/route"], function(angular, config, run) {
	var quefome = angular.module("quefome", ["ngRoute", "qfControllers"]);
	quefome.config(config);
	quefome.run(run);

	return quefome;
});