$require = require("./util/require/require.js");
$require("expand-js-api");
$require("model");

var config = $require("config");

var path = require("path");
var fs = require("fs");

var DIR = __dirname;
var CONTROLLERS_DIR = path.join(DIR, "controllers");
var MODELS_DIR = path.join(DIR, "models");
var VIEWS_DIR = path.join(DIR, "views");
var PUBLIC_DIR = path.join(DIR, "public");

var ControllerCollection = function(app) {
	var express = require("express");
	var router = express.Router();

	var loadedControllers = [];

	var loadRecursive = function(dir, namespace) {
		if (!dir) {
			dir = CONTROLLERS_DIR;
			namespace = "/";
		}

		var readableFiles = [];
		var routeConfig = false;
		fs.readdirSync(dir).forEach(function(file) {
			if (file.indexOf("_config.js") >= 0) {
				routeConfig = require(path.join(dir, file));

				if (typeof(routeConfig) === "function") {
					routeConfig(router);
				} else if (typeof(routeConfig) === "object" && typeof(routeConfig.beforeLoad) === "function") {
					routeConfig.beforeLoad(router);
				}

				console.log(namespace);
			} else {
				readableFiles.push(file);
			}
		});

		var self = this;
		readableFiles.forEach(function(file) {
			var absoluteFile = path.join(dir, file);

			if (fs.lstatSync(absoluteFile).isDirectory()) {
				loadRecursive.call(self, absoluteFile, namespace + file + "/");
			} else {
				var controller = require(absoluteFile);
				self.loadController(namespace + file, controller);

				console.log(namespace + file);
			}
		});

		if (typeof(routeConfig) === "object" && typeof(routeConfig.afterLoad) === "function") {
			routeConfig.afterLoad(router);
			console.log(namespace);
		}

		console.log("");
	}

	this.load = function() {
		if (loadedControllers && loadedControllers.length) {
			return;
		}

		console.log("Carregando controllers...");
		loadRecursive.call(this);
		
		app.use(router);
	};

	this.loadController = function(namespace, controller) {
		if (typeof(controller) === "function") {
			controller(router);
			loadedControllers.push(namespace);
		}
	};

	this.isLoaded = function(controllerNamespace) {
		return controllerNamespace ? loadedControllers.indexOf(controllerNamespace) >= 0 : false;
	}
};

var ModelCollection = function()  {

	this.load = function() {
		var self = this;

		fs.readdirSync(MODELS_DIR).forEach(function(file) {
			var modelName = file.replace(/\.js$/, "");
			var model = require(path.join(MODELS_DIR, file));

			if (typeof(model) === "function") {
				util.Object.extends(Model, model);
				model = new model();
			}

			self[modelName] = model;
		});
	};

	this.isLoaded = function(modelName) {
		return this[modelName];
	};

};

var App = function() {
	var express = require("express");
	var app = express();
	var server = null;

	this.config = config;
	this.models = new ModelCollection();
	this.controllers = new ControllerCollection(app);

	var loadMiddlewareParsers = function() {
		var logger = require("morgan");
		var bodyParser = require("body-parser");
		var methodOverride = require("method-override");
		var cookieParser = require("cookie-parser");
		var session = require("express-session");
		//var multipart = require("connect-multiparty");
		//var errorhandler = require("errorhandler");

		app.use(logger('dev'));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(methodOverride());
		app.use(cookieParser());
		app.use(session({secret: config.webapp.session.secret, resave: false, saveUninitialized: false, cookie: {maxAge: 60000}}));
		//app.use(multipart({uploadDir: config.webapp.upload.dir}));
		app.use(express.static(PUBLIC_DIR));
	};

	var configureErrorHandlers = function() {
		// catch 404 and forward to error handler
		app.use(function(req, res, next) {
			var err = new Error('Not Found');
			err.status = 404;
			next(err);
		});

		if (config.debug) {
			app.use(function(err, req, res, next) {
				res.status(err.status || 500);
				res.render('error', {
					message: err.message ,
					error: err
				});
			});
		}

		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: {
					status: err.status || 500,
					stack: ""
				}
			});
		});
	};

	var configureApp = function() {
		var ejs = require("ejs");

		app.set('port', config.webapp.port);
		app.set('views', VIEWS_DIR);
		app.set('view engine', 'html');
		app.engine('html', ejs.renderFile);
	};

	this.bootstrap = function() {
		config.override();

		configureApp();
		loadMiddlewareParsers();

		this.models.load();
		this.controllers.load();

		configureErrorHandlers();

		if (typeof(callback) === "function") {
			callback.call(this);
		}
	};

	this.start = function(callback) {
		var self = this;

		server = app.listen(app.get("port"), function() {
			if (typeof(callback) === "function") {
				callback.call(self);
			}
		});
	};

};

app = new App();
module.exports = app;
