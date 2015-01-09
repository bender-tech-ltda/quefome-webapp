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

Dog.extends(Animal);
dog = new Dog();

describe("the Dog prototype", function() {

	it("should inherits Animal", function() {
		expect(Dog.inherits(Animal)).toBe(true);
	});

	it("should behaves like an Animal", function() {
		expect(dog.energyze()).toEqual("eat");
	});

	it("and also behaves like a Dog", function() {
		expect(dog.speak()).toEqual("au au au");
	});

});

var object = {
	name: "Supercow",
	age: "42"
};

var copiedObject = object.copy();

describe("copying objects", function() {
	it("should copy only the content of objects", function() {
		expect(JSON.stringify(copiedObject)).toEqual(JSON.stringify(object));
	});

	it("and not it instance", function() {
		expect(copiedObject == object).toBe(false);
	});

});