"use strict";

define(["angular", "angular/mock", "quefome/directives"], function(angular) {

	describe("$notification", function() {
		var $notification;
		var Mocked$windowState;
		var MockedNotification;

		beforeEach(module("qfDirectives"));

		beforeEach(function() {
			Mocked$windowState = {
				_hasFocusReturn: false,
				_hasFocusCalled: false,
				hasFocus: function() {
					this._hasFocusCalled = true;
					return this._hasFocusReturn;
				}
			};

			module(function($provide) {
				$provide.value("$windowState", Mocked$windowState);
			});
		});

		beforeEach(inject(function(_$notification_) {
			$notification = _$notification_;
		}));

		describe("when using the browser notification", function() {
			it("should not throw an error on requestPermission", function() {
				expect(function() {
					$notification.requestPermission();
				}).not.toThrow();
			});

			it("should not throw an error on notify", function() {
				expect(function() {
					$notification.notify("Teste Notificação", "Mensagem da notificação", true);
				}).not.toThrow();
			});
		});

		describe("when the browser doenst support notifications", function() {
			beforeEach(function() {
				$notification.__setNotification(null);
			});

			it("should not throw an error on requestPermission", function() {
				expect(function() {
					$notification.requestPermission();
				}).not.toThrow();
			});

			it("should not throw an error on notify", function() {
				expect(function() {
					$notification.notify("Teste Notificação", "Mensagem da notificação");
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

				it("should accept a show flag option", function() {
					MockedNotification._called = false;
					$notification.notify("title", "message", {
						show: false
					});
					expect(MockedNotification._called).toBe(false);

					MockedNotification._called = false;
					$notification.notify("title", "message", {
						show: true
					});
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
						var notification = $notification.notify("Teste", "teste", {show: false});
						expect(MockedNotification._called).toBe(false);

						notification.show();
						expect(MockedNotification._called).toBe(true);
					});

					it("should have a hide function", function() {
						var notification = $notification.notify("Teste", "teste");
						expect(MockedNotification._closeCalled).toBe(false);

						notification.hide();
						expect(MockedNotification._closeCalled).toBe(true);
					});
				});

				describe("with the showIfNoFocus option", function() {
					it("should only show the notification if the window has no focus when true", function() {
						MockedNotification._called = false;
						Mocked$windowState._hasFocusCalled = false;

						Mocked$windowState._hasFocusReturn = false;
						$notification.notify("teste", "blabla", {
							showIfNoFocus: true
						});

						expect(MockedNotification._called).toBe(true);
						expect(Mocked$windowState._hasFocusCalled).toBe(true);
					});

					it("should not check if the window has focus when false", function() {
						Mocked$windowState._hasFocusCalled = false;

						$notification.notify("teste", "blabla", {
							showIfNoFocus: false
						});
						expect(Mocked$windowState._hasFocusCalled).toBe(false);

						Mocked$windowState._hasFocusCalled = false;

						$notification.notify("teste", "blabla");
						expect(Mocked$windowState._hasFocusCalled).toBe(false);
					});
				});
			});
		});
	});
});