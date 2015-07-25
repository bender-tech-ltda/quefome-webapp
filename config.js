var environment = process.env.NODE_ENV;

if (!environment) {
	environment = "development";
}

if (typeof(environment) === "string") {
	environment = environment.trim().toLowerCase();
}

module.exports = {
	debug: environment == "development",

	webapp: {
		port: (process.env.PORT || 3000),

		session: {
			secret: ("H698Hkas637ASmNasd3901iasdL" || process.env.SESSION_SECRET)
		},

		datasource: "mongo"
	},

	webservice: {
		baseUrl: (process.env.WS_URL || "http://localhost:8080/QueFomeCoreMVP/")
	},

	mongo: {
		url: (process.env.MONGO_URL || "mongodb://localhost:27017/quefome")
	},

	view: {
		landingPageUrl: ("http://delivery.quefo.me" || process.env.DELIVERY_PAGE_URL),

		social: {
			facebookPageUrl: ("https://facebook.com/quefome" || process.env.FACEBOOK_PAGE_URL),
			twitterPageUrl: ("https://twitter.com/quefome" || process.env.TWITTER_PAGE_URL)
		},

		analytics: {
			appKey: (process.env.APP_ANALYTICS_KEY || false),
			adminKey: (process.env.ADMIN_ANALYTICS_KEY || false),
		},

		seo: {
			allowRobots: (process.env.ALLOW_SE_ROBOTS ? true : false)
		}
	},

	override: function(configFile) {
		this.view.debug = this.debug;
	}
	
};