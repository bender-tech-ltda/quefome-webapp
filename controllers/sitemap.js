var Q = require("q");
var sitemap = require("sitemap");
var moment = require("moment");

var config = $require("config");
var ProductType = app.models.ProductType;
var Establishment = app.models.Establishment;

var map = sitemap.createSitemap({
	hostname: config.robots.protocol + "://" + config.robots.domain,
	cacheTime: config.robots.cacheTime,
	urls: []
})

var getSimplePages = function() {
	var now = moment(now).format();

	return Q.fcall(function() {
		map.add({url: "/", priority: 0.1, lastmodISO: now});
		map.add({url: "/restaurantes/", priority: 0.1, lastmodISO: now});

		return map;
	});
};

var getFoodTypesPages = function() {
	return ProductType.list().then(function(productTypes) {
		var now = moment(now).format();

		productTypes.forEach(function(productType) {
			map.add({
				url: "/restaurantes/" + productType.url,
				priority: 0.1,
				lastmodISO: now
			});
		});

		return map;
	}, function() {
		return map;
	});
};

var getEstablishmentPages = function() {
	return Establishment.list().then(function(establishments) {
		var now = moment(now).format();

		establishments.forEach(function(establishment) {
			map.add({
				url: "/" + establishment.url,
				priority: 0.1,
				lastmodISO: now
			});
		});

		return map;
	}, function() {
		return map;
	});
};

var i = 0;

module.exports = function (router) {
	router.get("/sitemap.xml", function(req, res) {
		var promise = Q.fcall(function() {
			if (map.isCacheValid() && map.urls.length > 0) {
				return map;
			} else {
				map.urls = [];

				return Q.all([
					getSimplePages(), 
					getFoodTypesPages(),
					getEstablishmentPages()
				]);
			}
		});

		promise.then(function() {
			map.toXML(function(xml) {
				res.header("Content-Type", "application/xml");
				res.send(xml);
			});
		});
	});
};