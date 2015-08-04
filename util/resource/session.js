var session = require("express-session");
var config = $require("config");

var sessionOptions = {
	secret: config.server.session.secret,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 60000
	}
};

if (config.server.session.store.redis) {
	console.log("Session Store: Redis")

	var RedisStore = require("connect-redis")(session);

	sessionOptions.store = new RedisStore({
		host: config.integration.redis.host,
		port: config.integration.redis.port,
		pass: config.integration.redis.password
	});
} else {
	console.log("Session Store: in memory");
}

module.exports = session(sessionOptions);