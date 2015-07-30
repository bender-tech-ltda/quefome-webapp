var ViewData = function() {
	
	this.getData = function(req) {
		var config = $require("config");

		var data = util.Object.copy(config.view);
		data.debug = config.debug;
		data.info.url = data.info.baseUrl;

		if (req.url) {
			data.currentPath = req.originalUrl;
			data.info.url += req.originalUrl;
		}

		return data;
	};
};

module.exports = ViewData;