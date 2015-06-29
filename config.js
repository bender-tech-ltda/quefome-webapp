module.exports = {
	debug: false,

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
		}
	},

	override: function(configFile) {
		//TODO
	}
	
};