module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json")
	});

	grunt.loadTasks("tasks");

	grunt.registerTask("test", ["front-javascript-test"]);
	grunt.registerTask("compile", ["css-compile", "javascript-compile"]);

	grunt.registerTask("default", ["javascript-compile"]);
};
