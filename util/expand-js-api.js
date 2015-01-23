/**
	O objetivo desse script eh adicionar novos comportamentos para os prototipos padroes do JavaScript.
	Ainda nao sei se isso eh uma boa pratica ou nao, talvez isso seja refatorado no futuro...
**/

var path = require("path");
var fs = require("fs");

var EXPAND_DIR = path.join(__dirname, "expand");

global.util = {};

fs.readdirSync(EXPAND_DIR).forEach(function(file) {
	require(path.join(EXPAND_DIR, file));
});