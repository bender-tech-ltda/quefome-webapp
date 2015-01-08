require("../setup.js");

var duck = app.models.Duck;

describe("the duck", function() {
	it("should quack", function() {
		expect(duck.speak()).toEqual("quack");
	});

	it("should fly", function() {
		expect(duck.fly()).toEqual("flap flap flap");
	});

});