var environment = process.env.NODE_ENV;

if (!environment) {
	environment = "development";
}

if (typeof(environment) === "string") {
	environment = environment.trim().toLowerCase();
}

module.exports = {
	debug: environment === "development",

	env: {
		development: environment === "development",
		test: environment === "test",
		production: environment === "production",
	},

	server: {
		forceRedirect: (process.env.FORCE_REDIRECT ? true : false),

		secure: (process.env.USE_SSL_PROTOCOL ? true : false),
		domain: (process.env.APP_DOMAIN || "quefo.me"),
		port: (process.env.PORT || 3000),

		session: {
			store: {
				redis: (process.env.USE_REDIS_SESSION_STORE ? true : false)
			},
			name: (process.env.SESSION_NAME || "cXVlZm9tZV9zZXNzaW9uX2lk"),
			secret: (process.env.SESSION_SECRET || "H698Hkas637ASmNasd3901iasdL"),
			maxAge: (process.env.SESSION_MAX_AGE ? parseInt(process.env.SESSION_MAX_AGE) : (2592000 * 1000))
		}
	},

	integration: {
		webservice: {
			baseUrl: (process.env.WS_URL || "http://127.0.0.1:8080/QueFomeCoreMVP/")
		},

		prerender: {
			serviceUrl: (process.env.PRERENDER_URL || "http://127.0.0.1:3010/"),
			token: (process.env.PRERENDER_TOKEN || false)
		},

		redis: {
			host: (process.env.REDIS_HOST || "127.0.0.1"),
			port: (process.env.REDIS_PORT || "6379"),
			password: (process.env.REDIS_PASSWORD || ""),
			db: (process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 2),
		},

		seo: {
			cacheTime: (process.env.SITEMAP_CACHE_TIME || (1000*60*24))
		}
	},

	view: {
		info: {
			name: (process.env.WEBSITE_NAME || "Quefo.me"),
			title: (process.env.WEBSITE_TITLE || "Quefo.me - Peça comida e tele-entrega online - Delivery de restaurantes"),
			description: (process.env.WEBSITE_DESCRIPTION || "Quefome é um aplicativo web para você pedir comida online do seu delivery ou restaurante favorito. Peça na internet e receba a tele-entrega em casa."),
			imageUrl: (process.env.WEBSITE_IMAGE || ""),
			largeImage: (process.env.WEBSITE_LARGE_IMAGE === "false" ? false : true),
			websiteType: (process.env.WEBSITE_TYPE || "website")
		},

		href: {
			landingPageUrl: (process.env.DELIVERY_PAGE_URL || "http://delivery.quefo.me"),

			social: {
				facebookPageUrl: (process.env.FACEBOOK_PAGE_URL || "https://facebook.com/quefomeapp"),
				twitterPageUrl: (process.env.TWITTER_PAGE_URL || "https://twitter.com/quefomeapp"),
			}
		},

		integration: {
			googleAnalytics: {
				appKey: (process.env.APP_ANALYTICS_KEY || false),
				adminKey: (process.env.ADMIN_ANALYTICS_KEY || false),
			},

			facebook: {
				pageId: (process.env.FACEBOOK_PAGE_ID || "")
			},

			twitter: {
				account: (process.env.TWITTER_ACCOUNT || "@quefomeapp")
			},

			seo: {
				allowRobots: (process.env.ALLOW_ROBOTS ? true : false)
			}
		}
	},

	override: function(configFile) {
		this.view.debug = this.debug;
	}
	
};