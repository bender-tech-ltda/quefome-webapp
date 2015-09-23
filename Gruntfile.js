module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		requirejs: {
			compile: {
				options: {
					mainConfigFile: "public/assets/js/quefome/main.js",
					baseUrl: "public/assets/js",
					name: "quefome/quefome",
					out: "public/assets/js/quefome.min.js"
				}
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-requirejs");

	grunt.registerTask("default", ["requirejs"]);
};
