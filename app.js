var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var MongoClient = require('mongodb').MongoClient;

var app = express();
var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;
var dbName = process.env.DB_NAME || 'db_circles';

var dbURL = 'mongodb://'+dbHost+':'+dbPort+'/'+dbName;
if (app.get('env') == 'live'){
// prepend url with authentication credentials // 
	dbURL = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+dbHost+':'+dbPort+'/'+dbName;
}
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//db.getCollectionNames()
//app.use('/', index);
app.get('/', function(req, res, next) {
	var colName = [];
	MongoClient.connect(dbURL, function(err, db) {
		if (err) return
		db.listCollections().toArray(function(err, collections){
		    res.render('index', { collectionNames: collections});
			db.close();
		});
		
	});
	
});
app.get('/load', function(req, res, next) {
	var colName = req.query.fileName;
	MongoClient.connect(dbURL, function(err, db) {
	  if (err) return

	  var collection = db.collection(colName);
		collection.find({}).toArray(function(err, results){
			console.log("results:", results);
			res.send(results);
	 		db.close();
		});
	  
	});
  

});
app.post('/save', function(req, res){
    console.log("post req body: ", req.body);
    

	MongoClient.connect(dbURL, function(err, db) {
	  if (err) return

	  var collection = db.collection(req.body.mapName);
		collection.remove({}, function(err, result){
			console.log("removed");
			collection.insert(req.body.circles, function(err, result) {
			  	if(err){
			  		console.log("Error:", err);
			  	} else {
			  		console.log("Result:", result);
			  	}
			  	res.send(result);
			  	db.close();
			  });
		});
	  
	});
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
