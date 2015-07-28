var app = require('./app');
//TODO transformar isso em um modulo utilizavel (e.g. app.js = index.js e require("app")().start())
app.bootstrap();
app.start(function() {
	console.log('Servidor iniciado na porta ' + app.config.webapp.port);
});

//app.set('port', process.env.PORT || 3000);

//var server = app.listen(app.get('port'), function() {
//	debug('Express server listening on port ' + server.address().port);
//});