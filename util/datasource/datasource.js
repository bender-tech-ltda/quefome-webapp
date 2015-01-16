var config = $require("config");
var dataSource = $require(config.webapp.datasource);
module.exports = dataSource;