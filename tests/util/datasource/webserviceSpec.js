require("../../setup.js");

var WEB_SERVICE_PORT = 4567;

var server = require("http");
var callbackFunction = function() {};
server.createServer(function(req, res) {
	callbackFunction(req, res);
}).listen(WEB_SERVICE_PORT);

var setCallbackFunction = function(callback) {
	callbackFunction = callback;
};

setTimeout(function() {
	server.close();
}, 5000);

var webservice = $require("integration/webservice");
webservice.setConfig({
	baseUrl: "http://127.0.0.1:" + WEB_SERVICE_PORT
});

describe("the webservice", function() {
	describe("should make", function() {
		it("a GET request to /get", function(done) {
			setCallbackFunction(function(req) {
				expect(req.method.toUpperCase()).toEqual("GET");
				expect(req.url).toEqual("/get");

				done();
			});

			webservice.get("/get");
		});

		it("a POST request to /post", function(done) {
			setCallbackFunction(function(req) {
				expect(req.method.toUpperCase()).toEqual("POST");
				expect(req.url).toEqual("/post");

				done();
			});

			webservice.post("/post");
		});

		it("a PUT request to /put", function(done) {
			setCallbackFunction(function(req) {
				expect(req.method.toUpperCase()).toEqual("PUT");
				expect(req.url).toEqual("/put");

				done();
			});

			webservice.put("/put");
		});

		it("a DELETE request to /delete", function(done) {
			setCallbackFunction(function(req) {
				expect(req.method.toUpperCase()).toEqual("DELETE");
				expect(req.url).toEqual("/delete");

				done();
			});

			webservice.delete("/delete");
		});

		it("a HEAD request to /head", function(done) {
			setCallbackFunction(function(req) {
				expect(req.method.toUpperCase()).toEqual("HEAD");
				expect(req.url).toEqual("/head");

				done();
			});

			webservice.head("/head");
		});
	});
});
