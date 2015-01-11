"use strict";

define(["angular", "quefome/config", "quefome/run"], function(angular, config, run) {
	var quefome = angular.module("quefome", []);
	quefome.config(config);
	quefome.run(run);

	return quefome;
});