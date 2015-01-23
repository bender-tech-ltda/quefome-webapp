require("../../setup.js");

var Animal = function() {
	this.energyze = function() {
		//acho que todos os animais geram energias para si mesmos (???)
		return "eat";
	};

	this.speak = function() {
		return "silence";
	};
};

var Dog = function() {
	this.speak = function() {
		return "au au au"; //wtf?
	};
};

util.Object.extends(Animal, Dog);
dog = new Dog();

describe("the Dog prototype", function() {

	it("should inherits Animal", function() {
		expect(util.Object.inherits(Animal, Dog)).toBe(true);
	});

	it("should behaves like an Animal", function() {
		expect(dog.energyze()).toEqual("eat");
	});

	it("and also behaves like a Dog", function() {
		expect(dog.speak()).toEqual("au au au");
	});

});

describe("copying objects", function() {
	var object = {
		name: "Supercow",
		age: "42"
	};

	var copiedObject = util.Object.copy(object);

	it("should copy only the content of objects", function() {
		expect(JSON.stringify(copiedObject)).toEqual(JSON.stringify(object));
	});

	it("and not its instance", function() {
		copiedObject.newProperty = "teste";

		expect(copiedObject.newProperty).toBeDefined();
		expect(object.newProperty).toBeUndefined();
	});

});