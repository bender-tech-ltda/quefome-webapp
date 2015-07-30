var ViewData = function() {
	
	this.getData = function(req) {
		var config = $require("config");

		var data = util.Object.copy(config.view);
		data.debug = config.debug;

		if (req.url) {
			data.currentUrl = req.url;
			data.info.url = req.url;
		}

		return data;
	};
};

module.exports = ViewData;