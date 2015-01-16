require("../../setup.js");

var config = $require("config");
var mongo = $require("mongo");

if (config.webapp.datasource == "mongo") {
	describe("the mongo client", function() {

		afterEach(function() {
			mongo.do(function(err, db) {
				db.collection("testes").remove();
			});
		});

		it("must have a 'do' function", function() {
			expect(mongo).toBeFunction();
		});

		it("must connect to mongo service", function(done) {
			mongo.do(function(err) {
				expect(err).toBeNull();
				done();
			});
		});
		
		it("must insert a register", function(done) {
			mongo.do(function(err, db) {
				db.collection("testes").insert({
					name: "teste"
				}, function(err) {
					expect(err).toBeNull();
					done();
				});
			});
		});

		it("must update a register", function(done) {
			var register = {_id: -1, name: "teste"};

			mongo.do(function(err, db) {
				var collection = db.collection("testes");

				collection.insert(register, function(err) {
					expect(err).toBeNull();
					
					register.name = "teste-update";

					collection.update({_id: register._id}, register, function(err) {
						expect(err).toBeNull();
						done();
					});
				});
			});
		});

		it("must delete a register", function(done) {
			var register = {_id: -2, name: "outro teste"};

			mongo.do(function(err, db) {
				var collection = db.collection("testes");

				collection.insert(register, function(err) {
					expect(err).toBeNull();

					collection.remove({_id: register._id}, function(err) {
						expect(err).toBeNull();
						done();
					});
				});
			});
		});

	});
}