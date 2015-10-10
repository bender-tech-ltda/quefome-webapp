module.exports = function(grunt) {
	var requirejsDefaultOptions = {
		baseUrl: "public/assets/js",

		paths: {
			requireLib: "../../components/requirejs/require"
		},

		include: ["requireLib"],

		preserveLicenseComments: false,
		optimize: "uglify"
	};

	var requireJsConfig = {
		webapp: {},
		webadmin: {}
	};

	requireJsConfig.webapp.options = grunt.util._.clone(requirejsDefaultOptions);
	requireJsConfig.webapp.options.mainConfigFile = "public/assets/js/quefome/main.js";
	requireJsConfig.webapp.options.name = "quefome/quefome";
	requireJsConfig.webapp.options.out = "public/dist/js/quefome.min.js"

	requireJsConfig.webadmin.options = grunt.util._.clone(requirejsDefaultOptions);
	requireJsConfig.webadmin.options.mainConfigFile = "public/assets/js/quefome/admin/main.js";
	requireJsConfig.webadmin.options.name = "quefome/admin/admin";
	requireJsConfig.webadmin.options.out = "public/dist/js/quefome-admin.min.js"

	grunt.initConfig({
		requirejs:requireJsConfig
	});

	grunt.loadNpmTasks("grunt-contrib-requirejs");

	grunt.registerTask("javascript-compile", ["requirejs"]);
};