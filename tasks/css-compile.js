module.exports = function(grunt) {
	grunt.config.merge({
		cssmin: {
			options: {
				keepSpecialComments: "0"
			},
			
			webapp: {
				files: {
					"public/dist/css/quefome.min.css": [
						"public/components/bootstrap/dist/css/bootstrap.css",
						"public/assets/css/quefome.css",
						"public/assets/css/quefome-icons.css"
					]
				}
			},

			webadmin: {
				files: {
					"public/dist/css/quefome-admin.min.css": [
						"public/components/bootstrap/dist/css/bootstrap.css",
						"public/assets/css/quefome-admin.css",
						"public/assets/css/quefome-icons.css"
					]
				}	
			}
		}
	});


	grunt.loadNpmTasks("grunt-contrib-cssmin");

	grunt.registerTask("css-compile", ["cssmin"]);
};