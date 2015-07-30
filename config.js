var environment = process.env.NODE_ENV;

if (!environment) {
	environment = "development";
}

if (typeof(environment) === "string") {
	environment = environment.trim().toLowerCase();
}

module.exports = {
	debug: environment == "development",

	server: {
		port: (process.env.PORT || 3000),

		session: {
			secret: (process.env.SESSION_SECRET || "H698Hkas637ASmNasd3901iasdL")
		}
	},

	integration: {
		webservice: {
			baseUrl: (process.env.WS_URL || "http://localhost:8080/QueFomeCoreMVP/")
		},

		prerender: {
			serviceUrl: (process.env.PRERENDER_URL || "http://localhost:3010/"),
			token: (process.env.PRERENDER_TOKEN || false)
		},

		seo: {
			protocol: (process.env.USE_SSL_PROTOCOL ? "https" : "http"),
			domain: (process.env.APP_DOMAIN || "quefo.me"),
			cacheTime: (process.env.SITEMAP_CACHE_TIME || (1000*60*24))
		}
	},

	view: {
		landingPageUrl: (process.env.DELIVERY_PAGE_URL || "http://delivery.quefo.me"),

		social: {
			facebookPageUrl: (process.env.FACEBOOK_PAGE_URL || "https://facebook.com/quefomeapp"),
			twitterPageUrl: (process.env.TWITTER_PAGE_URL || "https://twitter.com/quefomeapp")
		},

		analytics: {
			appKey: (process.env.APP_ANALYTICS_KEY || false),
			adminKey: (process.env.ADMIN_ANALYTICS_KEY || false),
		},

		seo: {
			allowRobots: (process.env.ALLOW_ROBOTS ? true : false)
		}
	},

	override: function(configFile) {
		this.view.debug = this.debug;
	}
	
};