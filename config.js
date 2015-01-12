module.exports = {
	debug: true,

	webapp: {
		port: (process.env.PORT || 3000),

		session: {
			secret: "H698Hkas637ASmNasd3901iasdL"
		}
	},

	override: function(configFile) {
		//TODO
	}
	
};