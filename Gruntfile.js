module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		requirejs: {
			compile: {
				options: {
					baseUrl: "public/assets/js",

					mainConfigFile: "public/assets/js/quefome/main.js",

					name: "quefome/quefome",
					paths: {
						requireLib: "../../components/requirejs/require"
					},
					include: ["requireLib"],

					preserveLicenseComments: false,
					optimize: 'none',

					out: "public/assets/js/quefome.min.js"
				}
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-requirejs");

	grunt.registerTask("default", ["requirejs"]);
};
