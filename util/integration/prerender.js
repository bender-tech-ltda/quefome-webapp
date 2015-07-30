var prerender = require("prerender-node");
var config = $require("config");

if (config.integration.prerender.token) {
	prerender.set("prerenderToken", config.integration.prerender.token);
} else {
	prerender.set("prerenderServiceUrl", config.integration.prerender.serviceUrl);
}

module.exports = prerender;