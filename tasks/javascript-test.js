module.exports = function(grunt) {
	grunt.config.merge({
		karma: {
			options: {
				basePath: "",

				frameworks: ["jasmine", "requirejs"],
				files: [
					"public/assets/js/tests/test-main.js",
					{pattern: "public/**/*.js", included: false},
					"views/**/*.html"
				],
				exclude: [
					"public/components/**/*Spec.js"
				],

				port: 9876,

				colors: true,
				reporters: ["progress"],
				logLevel: "INFO"
			},

			dev: {
				autoWatch: true, //observar mudanças nos arquivos JS
				singleRun: false, //executar sem parar

				browsers: ["Firefox"]
			},

			minified: {
				files: {
					src: [
						"public/dist/js/*.js"
					]
				},

				autoWatch: false, //nao observar mudanças nos arquivos JS
				singleRun: true, //executar uma única vez

				browsers: ["Firefox"]
			},

			ci: {
				//TODO configurar para rodar em ambiente de Continuous Integration
			}
		}
	});

	grunt.loadNpmTasks("grunt-karma");

	grunt.registerTask("front-javascript-test", "Teste o código Front-End JavaScript dessa aplicação.", function(mode) {
		if (!mode) {
			mode = "dev";
		}

		grunt.task.run("karma:" + mode);
	});
};