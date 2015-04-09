"use strict";

define(["angular", "angular/mock", "quefome/filters"], function(angular) {
	describe("establishmentSchedule filter", function() {
		var establishmentScheduleFilter;

		beforeEach(module("qfFilters"));

		beforeEach(inject(function($filter) {
			establishmentScheduleFilter = $filter("establishmentSchedule");
		}));

		var establishment, WeekDay;

		var formatTime = function(value) {
			var hours = value.getHours();
			if (hours < 10) {
				hours = "0" + hours;
			}

			var minutes = value.getMinutes();
			if (minutes < 10) {
				minutes = "0" + minutes;
			}

			return hours + ":" + minutes;
		};

		beforeEach(function() {
			establishment = {};
			establishment.parameters = {};

			WeekDay = [];
			WeekDay[0] = {number: 0, name: "Domingo"};
			WeekDay[1] = {number: 1, name: "Segunda"};
			WeekDay[2] = {number: 2, name: "Terça"};
			WeekDay[3] = {number: 3, name: "Quarta"};
			WeekDay[4] = {number: 4, name: "Quinta"};
			WeekDay[5] = {number: 5, name: "Sexta"};
			WeekDay[6] = {number: 6, name: "Sábado"};
		});

		it("should return the schedule time if the establishment is open", function() {
			establishment.parameters.status = 'OPEN';
			establishment.parameters.currentSchedule = {};
			establishment.parameters.currentSchedule.weekDay = WeekDay[(new Date).getDay()];
			establishment.parameters.currentSchedule.openingTime = new Date();
			establishment.parameters.currentSchedule.openingTime.setHours(19, 30);
			establishment.parameters.currentSchedule.closingTime = new Date();
			establishment.parameters.currentSchedule.closingTime.setHours(23, 15);

			var result = establishmentScheduleFilter(establishment);
			expect(result).toEqual("19:30 até 23:15");
		});

		it("should return the today schedule time if the establishment is closed and opens today", function() {
			establishment.parameters.status = 'CLOSED';
			establishment.parameters.currentSchedule = {};

			establishment.parameters.currentSchedule.weekDay = WeekDay[(new Date).getDay()];
			establishment.parameters.currentSchedule.openingTime = new Date();
			establishment.parameters.currentSchedule.openingTime.setHours(establishment.parameters.currentSchedule.openingTime.getHours() + 1, 0);

			var result = establishmentScheduleFilter(establishment);
			expect(result).toEqual("Abrirá hoje, às " + formatTime(establishment.parameters.currentSchedule.openingTime));
		});

		it("should return the tomorrow schedule time if the establishment is closed and opens tomorrow", function() {
			establishment.parameters.status = 'CLOSED';
			establishment.parameters.currentSchedule = {};

			establishment.parameters.currentSchedule.openingTime = new Date();
			establishment.parameters.currentSchedule.openingTime.setDate(establishment.parameters.currentSchedule.openingTime.getDate() + 1);
			establishment.parameters.currentSchedule.openingTime.setHours(18, 0);
			establishment.parameters.currentSchedule.weekDay = WeekDay[establishment.parameters.currentSchedule.openingTime.getDay()];

			var result = establishmentScheduleFilter(establishment);
			expect(result).toEqual("Abrirá amanhã, às 18:00");
		});

		it("should return the day of the week schedule that the establishment will open if it is a diferent day of the week", function() {
			establishment.parameters.status = 'CLOSED';
			establishment.parameters.currentSchedule = {};

			establishment.parameters.currentSchedule.openingTime = new Date();
			establishment.parameters.currentSchedule.openingTime.setDate(establishment.parameters.currentSchedule.openingTime.getDate() + 2);
			establishment.parameters.currentSchedule.openingTime.setHours(18, 0);
			establishment.parameters.currentSchedule.weekDay = WeekDay[establishment.parameters.currentSchedule.openingTime.getDay()];

			var result = establishmentScheduleFilter(establishment);
			expect(result).toEqual("Abrirá " + establishment.parameters.currentSchedule.weekDay.name + ", às 18:00");
		});

		it("should return the day of the week schedule that the establishment will open if the time has passed", function() {
			establishment.parameters.status = 'CLOSED';
			establishment.parameters.currentSchedule = {};

			establishment.parameters.currentSchedule.openingTime = new Date();
			establishment.parameters.currentSchedule.openingTime.setHours(establishment.parameters.currentSchedule.openingTime.getHours() - 1, 0);
			establishment.parameters.currentSchedule.weekDay = WeekDay[establishment.parameters.currentSchedule.openingTime.getDay()];

			var result = establishmentScheduleFilter(establishment);
			expect(result).toEqual("Abrirá " + establishment.parameters.currentSchedule.weekDay.name + ", às " + formatTime(establishment.parameters.currentSchedule.openingTime));
		});
	});
});