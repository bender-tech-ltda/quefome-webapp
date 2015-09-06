"use strict";

define(["angular", "angular/mock", "quefome/services"], function(angular) {

	describe("OrderService", function() {
		var $MockedDocument;
		var $httpBackend, PrintService;

		beforeEach(module("qfAdminServices"));

		beforeEach(function() {
			$MockedDocument = [];
			$MockedDocument[0] = {
				body: {
					_appendChildCalled: false,
					appendChild: function() {
						this._appendChildCalled = true;
					}
				},

				_createElementCalled: false,
				_createElementElementName: null,
				createElement: function(elementName) {
					this._createElementCalled = true;
					this._createElementElementName = elementName;

					return this._iframe;
				},

				_iframe: {
					src: null,
					style: {
						display: null
					},
					contentWindow: {
						document: {
							open: function() {},
							close: function() {},

							_writeHtml: null,
							write: function(html) {
								this._writeHtml = html;
							}
						},

						_printPageCalled: false,
						printPage: function(callback) {
							this._printPageCalled = true;
							callback();
						}
					},

					_removeCalled: false,
					remove: function() {
						this._removeCalled = true;
					}
				}
			};

			module(function($provide) {
				$provide.value("$document", $MockedDocument);
			});
		});

		beforeEach(inject(function(_PrintService_, _$httpBackend_) {
			$httpBackend = _$httpBackend_;
			PrintService = _PrintService_;
		}));

		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		describe("print()", function() {
			it("should make a get request URL to get content", function() {
				var content = null;
				var url = "/alguma/url/loca/";

				$httpBackend.whenGET(url).respond(200, "teste");

				PrintService.print(url).then(function(urlContent) {
					content = urlContent;
				});

				$httpBackend.flush();

				expect(content).toEqual("teste");
			});

			it("should support a object with the url and request properties", function() {
				var data = {name: "João"};
				var url = "/alguma/url/loca/";

				$httpBackend.whenPOST(url, function(headers) {
					return headers == JSON.stringify(data);
				}).respond(200, "teste");				

				PrintService.print({
					url: url,
					method: "post",
					data: data
				});

				$httpBackend.flush();
			});

			it("should create an iframe for printing", function() {
				var url = "/alguma/url/loca/";

				$httpBackend.whenGET(url).respond(200, "teste_123_teste");
				PrintService.print(url);
				$httpBackend.flush();

				expect($MockedDocument[0]._createElementCalled).toBe(true);
				expect($MockedDocument[0]._createElementElementName).toEqual("iframe");
			});

			it("should add the created iframe to the current document", function() {
				var url = "/alguma/url/loca/";

				$httpBackend.whenGET(url).respond(200, "teste_123_teste");
				PrintService.print(url);
				$httpBackend.flush();

				expect($MockedDocument[0].body._appendChildCalled).toBe(true);
			});

			it("should write the request content to the iframe", function() {
				var url = "/alguma/url/loca/";

				$httpBackend.whenGET(url).respond(200, "teste_123_teste");
				PrintService.print(url);
				$httpBackend.flush();

				expect($MockedDocument[0]._iframe.contentWindow.document._writeHtml).toContain("teste_123_teste");
			});

			it("should print the page and remove the iframe", function() {
				var url = "/alguma/url/loca/";
				
				$httpBackend.whenGET(url).respond(200, "teste_123_teste");
				PrintService.print(url);
				$httpBackend.flush();

				expect($MockedDocument[0]._iframe.contentWindow._printPageCalled).toBe(true);
				expect($MockedDocument[0]._iframe._removeCalled).toBe(true);
			});
		})
	});
});