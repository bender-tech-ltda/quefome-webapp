"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("$notification", function() {
		var $notification;
		var MockedNotification;

		beforeEach(module("qfServices"));

		beforeEach(inject(function(_$notification_) {
			$notification = _$notification_;
		}));

		describe("when using the browser notification", function() {
			it("should not throw an error", function() {
				expect(function() {
					$notification.notify("Teste Notificação", "Mensagem da notificação", true);
				}).not.toThrow();
			});
		});

		describe("when mocking the browser notification", function() {
			beforeEach(function() {			
				MockedNotification = function(title, options) {
					MockedNotification._called = true;
					MockedNotification._title = title;
					MockedNotification._options = options;
				};

				MockedNotification.prototype.close = function() {
					MockedNotification._closeCalled = true;
				};

				MockedNotification._called = false;
				MockedNotification._closeCalled = false;
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

			describe("when notifing", function() {
				it("should accept a title and a message", function() {
					$notification.notify("title", "message");
					expect(MockedNotification._title).toEqual("title");
					expect(MockedNotification._options.body).toEqual("message");
				});

				it("should accept a show flag", function() {
					MockedNotification._called = false;
					$notification.notify("title", "message", false);
					expect(MockedNotification._called).toBe(false);

					MockedNotification._called = false;
					$notification.notify("title", "message", true);
					expect(MockedNotification._called).toBe(true);
				});

				it("should accept a options object", function() {
					var options = {
						title: "blabla",
						message: "teste" 
					};

					$notification.notify(options);
					expect(MockedNotification._title).toEqual("blabla");
					expect(MockedNotification._options.body).toBe("teste");

					var options = {
						title: "blabla2",
						body: "teste2" 
					};

					$notification.notify(options);
					expect(MockedNotification._title).toEqual("blabla2");
					expect(MockedNotification._options.body).toBe("teste2");
				});

				describe("the notification object", function() {
					it("should have a show function", function() {
						var notification = $notification.notify("Teste", "teste", false);
						expect(MockedNotification._called).toBe(false);

						notification.show();
						expect(MockedNotification._called).toBe(true);
					});

					it("should have a hide function", function() {
						var notification = $notification.notify("Teste", "teste", true);
						expect(MockedNotification._closeCalled).toBe(false);

						notification.hide();
						expect(MockedNotification._closeCalled).toBe(true);
					});
				});
			});
		});
	});
});