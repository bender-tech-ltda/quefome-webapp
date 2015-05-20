"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("$notification", function() {
		var $notification;
		var MockedNotification;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_$notification_) {
			$notification = _$notification_;
		}));

		beforeEach(function() {			
			MockedNotification = function(title, options) {
				MockedNotification._title = title;
				MockedNotification._options = options;
			};

			MockedNotification._title = null;
			MockedNotification._options = null;

			MockedNotification._requestPermissionCalled = false;
			MockedNotification.requestPermission = function() {
				MockedNotification._requestPermissionCalled = true;
			};

			MockedNotification.permission = false;

			$notification.__setNotification(MockedNotification);
		});

		describe("when requesting permission", function() {
			it("should call the Notification method", function() {
				$notification.requestPermission();
				expect(MockedNotification._requestPermissionCalled).toBe(true);
			});

			it("should only call if has no permission yet", function() {
				MockedNotification.permission = "denied";
				$notification.requestPermission();
				expect(MockedNotification._requestPermissionCalled).toBe(true);

				MockedNotification._requestPermissionCalled = false;
				MockedNotification.permission = "granted";
				$notification.requestPermission();
				expect(MockedNotification._requestPermissionCalled).toBe(false);
			});

			it("should return a promise", function() {
				var promise = $notification.requestPermission();
				expect(promise.then).toBeDefined();
			});
		});

	});
});