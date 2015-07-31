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
		secure: (process.env.USE_SSL_PROTOCOL ? true : false),
		domain: (process.env.APP_DOMAIN || "quefo.me"),
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
		info: {
			name: (process.env.WEBSITE_NAME || "Quefo.me"),
			title: (process.env.WEBSITE_TITLE || "Quefo.me - Peça comida e tele-entrega online - Delivery de restaurantes"),
			description: (process.env.WEBSITE_DESCRIPTION || "Quefome é um aplicativo web para você pedir comida online do seu delivery ou restaurante favorito. Peça na internet e receba a tele-entrega em casa."),
			baseUrl: (process.env.WEBSITE_BASE_URL || "http://quefo.me"),
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