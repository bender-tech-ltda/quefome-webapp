"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("AuthController", function() {
		var $httpBackend;

		beforeEach(module("qfservices"));

		beforeEach(inject(function(_$httpBackend_) {
			$httpBackend = _$httpBackend_;
		}));
	});
});