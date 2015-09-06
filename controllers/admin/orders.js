module.exports = function Partials(router) {
	router.post("/admin/orders/:order/print/", function(req, res) {
		var order = req.body;

		if (!req.authorized || !req.session || !req.session.establishmentUser || !order) {
			res.send(404);
			return;
		}

		var helpers = {
			formatDate: function(date) {
				if (!(date instanceof Date)) {
					date = new Date(date);
				}

				var twoPlaceDigit = function(number) {
					return number < 10 ? ("0" + number) : ("" + number);
				};

				var day = twoPlaceDigit(date.getDate());
				var month = twoPlaceDigit(date.getMonth() + 1);
				var year = date.getFullYear();
				var hour = twoPlaceDigit(date.getHours());
				var minute = twoPlaceDigit(date.getMinutes());

				return day + "/" + month + "/" + year + " " + hour + ":" + minute;
			},
			formatCurrency: function(number) {
				return number.toFixed(2).replace(",", "").replace(".", ",");
			},
			joinObjectArray: function(array, property, joinChar) {
				var propertyArray = [];

				for (var arrayIndex = 0; arrayIndex < array.length; arrayIndex++) {
					propertyArray.push(array[arrayIndex][property]);
				}

				return propertyArray.join(joinChar);
			},
			formatComponentValue: function(component) {
				if (component.selectedOption) {
					return component.selectedOption.name;
				}
				
				return component.value ? "Sim" : "Não";
			}
		};

		res.render("admin/partials/orders/print", {
			order: order,
			helpers: helpers
		});
	});
};