var config = $require("config");

var basePath = (config.server.secure ? "https://" : "http://") + config.server.domain;

var robots = [
	{
		name: "*",
		disallow: ["/usuario"],
		sitemap: "sitemap.xml"
	}
];

module.exports = function (router) {
	router.get("/robots.txt", function(req, res) {
		var txt = [];

		robots.forEach(function(robot) {
			txt.push("User-agent: " + robot.name);

			if (robot.disallow && robot.disallow.length > 0) {
				robot.disallow.forEach(function(disallowUrl) {
					txt.push("Disallow: " + disallowUrl);
				});
			} else {
				txt.push("Disallow:");
			}

			if (robot.sitemap) {
				txt.push("Sitemap: " + basePath + "/" + robot.sitemap);
			}

			txt.push("");
		});

		res.header("Content-Type", "text/plain");
		res.send(txt.join("\n"));
	});
};