$require = require("./require");
var config = $require("config");

var path = require("path");
var fs = require("fs");

var DIR = __dirname;
var CONTROLLERS_DIR = path.join(DIR, "controllers");
var MODELS_DIR = path.join(DIR, "models");
var VIEWS_DIR = path.join(DIR, "views");
var PUBLIC_DIR = path.join(DIR, "public");

var ControllerCollection = function(express) {
	var router = express.Router();

	var loadedControllers = [];

	var loadRecursive = function(dir, namespace) {
		if (!dir) {
			dir = CONTROLLERS_DIR;
			namespace = "";
		}

		var readableFiles = [];

		fs.readdirSync(dir).forEach(function(file) {
			if (file.indexOf("_config.js") >= 0) {
				//TODO ler arquivo de configuração dos controllers
			} else {
				readableFiles.push(file);
			}
		});

		readableFiles.forEach(function(file) {
			if (fs.lstatSync(file).isDirectory()) {
				loadRecursive(path.join(dir, file), namespace + file + ".");
			} else {
				var controller = require(path.join(dir, file));
				this.loadController(namespace + file, controller);
				
			}
		});
	}

	this.load = function() {
		if (loadedControllers && loadedControllers.length) {
			return;
		}

		loadRecursive();
	};

	this.loadController = function(namespace, controller) {
		if (typeof(controller) === "function") {
			controller(router);
			loadedControllers.push(namespace + file);
		}
	};

	this.isLoaded = function(controllerNamespace) {
		return controllerNamespace ? loadedControllers.indexOf(controllerNamespace) >= 0 : false;
	}
};

var ModelCollection = function()  {

};

var App = function() {
	var express = require("express");
	var app = express();

	this.controllers = new ControllerCollection(express);
	this.models = new ModelCollection();

	var loadMiddlewareParsers = function() {
		var logger = require('morgan');
		var bodyParser = require('body-parser');
		var methodOverride = require("method-override");
		var cookieParser = require('cookie-parser');
		var session = require('express-session');
		var multipart = require("connect-multiparty");
		var errorhandler = require("errorhandler");

		app.use(logger('dev'));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(methodOverride());
		app.use(cookieParser());
		app.use(session({secret: config.webapp.session.secret, resave: false, saveUninitialized: false}));
		app.use(multipart({uploadDir: config.webapp.upload.dir}));
		app.use(express.static(PUBLIC_DIR));

		configureErrorHandlers();
	};

	var configureErrorHandlers = function() {
		// catch 404 and forward to error handler
		app.use(function(req, res, next) {
			var err = new Error('Not Found');
			err.status = 404;
			next(err);
		});

		// development error handler
		// will print stacktrace
		if (app.get('env') === 'development') {
			app.use(function(err, req, res, next) {
				res.status(err.status || 500);
				res.render('error', {
					message: err.message,
					error: err
				});
			});
		}

		// production error handler
		// no stacktraces leaked to user
		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: {}
			});
		});
	};

	var configureApp = function() {
		app.set('port', config.webapp.port);
		app.set('views', VIEWS_DIR);
		app.set('view engine', 'jade');
	};

	this.bootstrap = function() {
		config.override();

		configureApp();
		loadMiddlewareParsers();

		this.controllers.load();
		this.models.load();

		if (typeof(callback) === "function") {
			callback();
		}
	};

};

app = new App();
module.exports = app;
