module.exports = {
	debug: true,

	webapp: {
		port: (process.env.PORT || 3000),

		session: {
			secret: "H698Hkas637ASmNasd3901iasdL"
		},

		datasource: "mongo"
	},

	webservice: {
		baseUrl: (process.env.WS_URL || "http://localhost:8080/QueFomeCoreMVP/")
	},

	mongo: {
		url: process.env.MONGO_URL || "mongodb://localhost:27017/quefome"
	},

	override: function(configFile) {
		//TODO
	}
	
};