module.exports = function(grunt) {
	grunt.initConfig({
		requirejs: {
			"webapp": {
				options: {
					baseUrl: "public/assets/js",

					mainConfigFile: "public/assets/js/quefome/main.js",

					name: "quefome/quefome",
					paths: {
						requireLib: "../../components/requirejs/require"
					},
					include: ["requireLib"],

					preserveLicenseComments: false,
					optimize: "none",

					out: "public/dist/js/quefome.min.js"
				}
			},

			"webadmin": {
				options: {
					baseUrl: "public/assets/js",

					mainConfigFile: "public/assets/js/quefome/admin/main.js",

					name: "quefome/admin/admin",
					paths: {
						requireLib: "../../components/requirejs/require"
					},
					include: ["requireLib"],

					preserveLicenseComments: false,
					optimize: "none",

					out: "public/dist/js/quefome-admin.min.js"
				}
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-requirejs");

	grunt.registerTask("compile-javascript", ["requirejs"]);
};