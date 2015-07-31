var ViewData = function() {
	
	this.getData = function(req) {
		var config = $require("config");

		var data = util.Object.copy(config.view);
		data.debug = config.debug;

		data.baseUrl = (config.server.secure ? "https://" : "http://") + config.server.domain;
		data.currentUrl = data.baseUrl;

		if (req.originalUrl) {
			data.currentPath = req.originalUrl;
			data.currentUrl += req.originalUrl;
		}

		return data;
	};
};

module.exports = ViewData;