var debug = require('debug')('quefome-webapp');
var app = require('./app');

app.bootstrap();
app.start(function() {
	debug('Express server listening ');
});

//app.set('port', process.env.PORT || 3000);

//var server = app.listen(app.get('port'), function() {
//	debug('Express server listening on port ' + server.address().port);
//});