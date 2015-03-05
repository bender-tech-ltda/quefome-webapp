var Q = require("q");
var webservice = $require("webservice");

var Address = function() {
	this.searchZipCode = function(zipCode) {
		return webservice.get("http://viacep.com.br/ws/" + zipCode + "/json/").then(function(response) {
			var address = response.body;

			return {
				zipCode: address.cep,
				address: address.logradouro,
				neighborhood: address.bairro,
				city: {
					name: address.localidade,
					ibgeCode: address.ibge,
					state: {
						acronym: address.uf
					}
				}
			};
		});
	};
};

module.exports = Address;