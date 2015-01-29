/**
require("../../setup.js");

var config = $require("config");
var mongo = $require("mongo");

if (config.webapp.datasource == "mongo") {
	describe("the mongo client", function() {

		afterEach(function() {
			mongo._connect().then(function(db) {
				db.collection("testes").drop();
			});
		});

		it("must connect to mongo service", function(done) {
			mongo._connect().then(function(db) {
				expect(db).toBeDefined();
				done();
			}, function() {
				expect(false).toBe(true); //nao sei o melhor jeito de falhar o teste
				done();
			});
		});
		
		it("must insert a register", function(done) {
			mongo.post("/testes/insert", {name: "teste"}).then(function(data) {
				expect(data).toBeDefined();
				expect(data.status).toEqual(200);
				expect(data.body).toBeDefined();
				expect(data.body.name).toEqual("teste");

				done();
			}, function(err) {
				expect(false).toBe(true);
				done();
			});
		});

		it("must update a register", function(done) {
			mongo.post("/testes/insert", {_id: -1, name: "teste"}).then(function(data) {
				mongo.put("/testes/update", {_id: -1, name: "teste2"}).then(function(data) {
					expect(data).toBeDefined();
					expect(data.status).toEqual(200);

					done();
				}, function(err) {
					expect(false).toBe(true);
					done();
				});
			});
		});

		it("must save a register", function(done) {
			var register = {_id: -6, name: "teste"};

			mongo.post("/testes/save", register).then(function(data) {
				expect(data).toBeDefined();
				expect(data.status).toEqual(200);

				mongo.put("/testes/save/", register).then(function(data) {
					expect(data).toBeDefined();
					expect(data.status).toEqual(200);

					done();
				}, function(err) {
					expect(false).toBe(true);
					done();
				});
			});
		});

		it("must delete a register", function(done) {
			var register = {_id: -2, name: "outro teste"};

			mongo.post("/testes/insert", register).then(function(data) {
				mongo.delete("/testes/delete/" + register._id).then(function(data) {
					expect(data).toBeDefined();
					expect(data.status).toEqual(200);

					done();
				}, function(err) {
					expect(false).toBe(true);
					done();
				});
			});
		});

		it("must find a register", function(done) {
			var register = {_id: -7, name: "pudim", lastName: "da silva"};

			mongo.post("/testes/insert", register).then(function(data) {
				mongo.get("/testes/list/", {name: "pudim", lastName: "da silva"}).then(function(list) {
					expect(list).toBeDefined();
					expect(list.body).toBeDefined();
					expect(list.body[0]).toBeDefined();
					expect(list.body[0]._id).toEqual(register._id);

					done();
				}, function(err) {
					expect(false).toBe(true);
					done();
				});
			});
		});

	});
}
**/