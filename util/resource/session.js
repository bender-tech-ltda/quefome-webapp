var session = require("express-session");
var config = $require("config");

var sessionOptions = {
	name: config.server.session.name,
	secret: config.server.session.secret,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: config.server.session.maxAge,
		secure: config.server.secure,
		httpOnly: false
	}
};

if (config.server.session.store.redis) {
	console.log("Session Store: Redis")

	var RedisStore = require("connect-redis")(session);

	sessionOptions.store = new RedisStore({
		host: config.integration.redis.host,
		port: config.integration.redis.port,
		pass: config.integration.redis.password,
		db: config.integration.redis.db
	});
} else {
	console.log("Session Store: MemoryStore");
}

module.exports = session(sessionOptions);