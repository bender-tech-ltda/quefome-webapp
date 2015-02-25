define(["angular", "quefome/admin/config", "quefome/admin/run", "quefome/admin/services" ,"quefome/admin/controllers", "angular/route"], function(angular, config, run) {
	"use strict";
	
	var quefome = angular.module("quefomeAdmin", ["ngRoute", "qfAdminServices", "qfAdminControllers"]);
	quefome.config(config);
	quefome.run(run);

	return quefome;
});