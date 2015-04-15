var Q = require("q");
var webservice = $require("webservice");

var Address = function() {
	var simplifyAddress = function(address) {
		var simplifiedAddress = {
			zipCode: "",
			address: "",
			neighborhood: "",
			city: "",
			state: ""
		};

		if (address) {
			simplifiedAddress.zipCode = address.zipCode;
			simplifiedAddress.address = address.address;
			simplifiedAddress.neighborhood = typeof(address.neighborhood) === "object" ? address.neighborhood.name : address.neighborhood;
			simplifiedAddress.city = typeof(address.city) === "object" ? address.city.name : address.neighborhood;
			simplifiedAddress.state = typeof(address.city) === "object" ? (typeof(address.city.state) === "object" ? address.city.state.acronym : address.city.state) : address.state;
		}

		return simplifiedAddress;
	};

	var complicateAddress = function(address) {
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
	};

	this.searchZipCode = function(zipCode) {
		return webservice.get("http://viacep.com.br/ws/" + zipCode + "/json/").then(function(response) {
			if (response.body.erro) {
				throw {
					statusCode: "404",
					body: "CEP " + zipCode + " não encontrado."
				};
			}

			return complicateAddress(response.body);
		});
	};

	this.searchAddress = function(address) {
		address = simplifyAddress(address);

		address.state = address.state.trim().toLowerCase();
		address.city = address.city.trim().toLowerCase();
		address.address = address.address.trim().toLowerCase();

		address.address = address.address.replace(new RegExp("^(av\.|av )"), "avenida");

		var url = "http://viacep.com.br/ws/";
		url += encodeURI(address.state) + "/" + encodeURI(address.city) + "/" + encodeURI(address.address) + "/json/";

		return webservice.get(url).then(function(response) {
			if (response.body && response.body.length > 0) {
				return complicateAddress(response.body[0]);
			}

			throw {
				statusCode: "404",
				body: "Endereço " + address.address + " - " + address.city + " - " + address.state
			};
		});
	};
};

module.exports = Address;