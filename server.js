var http = require('http');
var url = require('url');
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://g1140615:Alan19920711@ds141464.mlab.com:41464/g1140615';

var express = require('express');
var app = express();

var fileUpload = require('express-fileupload');
app.use(fileUpload());

var session = require('cookie-session');
app.use(session({ cookieName: 'session', keys: ['key1', 'key2'] }));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



//1.1 Create user accounts
app.get('/register', function (req, res, callback) {
	res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', function (req, res) {
	var criteria = { "name": req.body.name };
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(null, err);
		findUser(db, criteria, function (result) {
			if (result == null) {
				createUser(db, req.body.name, req.body.password,
					function (result) {
						db.close();
						res.redirect('/');
					}
				);
				console.log('User ' + req.body.name + ' with passcode:' + req.body.password + ' create successful.');
			}
			else {
				res.redirect('/register');
				console.log('User ' + req.body.name + ' exist.');
			}
		});
	});
});



function createUser(db, name, password, callback) {
	db.collection('user').insertOne({
		"name": name,
		"password": password
	}, function (err, result) {
		if (err) { result = err; }
		callback(result);
	}
	);
}

//1.2 User login with cookie session
app.get('/', function (req, res) {
	if (!req.session.authenticated) {
		res.sendFile(__dirname + '/public/login.html');
	}
	else {
		res.redirect('/read');
	}
});

app.post('/login', function (req, res) {
	var user = req.body.name;
	var password = req.body.password;
	var criteria = { "name": user };
	if (req.body.name != '' || req.body.name == null) {
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			findUser(db, criteria, function (result) {
				console.log(JSON.stringify(result));
				if (result == null) {
					res.redirect('/');
				} else if (result.name == user && result.password == password) {
					req.session.authenticated = true;
					req.session.username = req.body.name;
					res.redirect('/');
				} else {
					res.redirect('/');
				}
			});
		});
	} else {
		res.redirect('/');
	}
});

function findUser(db, criteria, callback) {
	db.collection('user').findOne(criteria,
		function (err, result) {
			assert.equal(err, null);
			callback(result);
		}
	)
}

//1.3 User logout with cookie session
app.get('/logout', function (req, res, next) {
	req.session = null;
	res.redirect('/');
});



//2,1 Create new restaurant documents
app.get('/new', function (req, res) {
	if (req.session.authenticated == true) {
		res.sendFile(__dirname + '/public/create.html');
	} else {
		res.sendFile(__dirname + '/public/login.html');
	}
});

app.post('/create', function (req, res) {
	var criteria = { "name": req.body.name };
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(null, err);
		findOneRestaurant(db, criteria, function (dbres) {
			if (dbres == null) {
				console.log(req.body.name + ' is not existed, pending to insert DB.')
				if (!req.files.sampleFile) {
					console.log(req.body.name +' is going to create WITHOUT file upload.')
					if (req.body.borough == null || req.body.borough == '') {
						req.body.borough = "";
					}
					if (req.body.cuisine == null || req.body.cuisine == '') {
						req.body.cuisine = "";
					}
					if (req.body.street == null || req.body.street == '') {
						req.body.street = "";
					}
					if (req.body.building == null || req.body.building == '') {
						req.body.building = "";
					}
					if (req.body.zipcode == null || req.body.zipcode == '') {
						req.body.zipcode = "";
					}
					if (req.body.lon == null || req.body.lon == '') {
						req.body.lon = "";
					}
					if (req.body.lat == null || req.body.lat == '') {
						req.body.lat = "";
					}
					createWithoutFile(db, req.session.username, req.body.name, req.body.borough, req.body.cuisine, req.body.street, req.body.building, req.body.zipcode, req.body.lon, req.body.lat,
						function (result) {
							db.close();
							if (result.insertedId != null) {
								res.status(200);
								res.redirect('/');
							} else {
								res.status(500);
								res.end(JSON.stringify(result));
							}
						}
					);
				} else {
					console.log(req.body.name +' is going to create WITH file upload.')
					if (req.body.borough == null || req.body.borough == '') {
						req.body.borough = "";
					}
					if (req.body.cuisine == null || req.body.cuisine == '') {
						req.body.cuisine = "";
					}
					if (req.body.street == null || req.body.street == '') {
						req.body.street = "";
					}
					if (req.body.building == null || req.body.building == '') {
						req.body.building = "";
					}
					if (req.body.zipcode == null || req.body.zipcode == '') {
						req.body.zipcode = "";
					}
					if (req.body.lon == null || req.body.lon == '') {
						req.body.lon = "";
					}
					if (req.body.lat == null || req.body.lat == '') {
						req.body.lat = "";
					}
					if( req.files.sampleFile.mimetype != 'image/png' && req.files.sampleFile.mimetype != 'image/jpg' ){
						console.log('file type error, return to /read');
						res.redirect('/read');
					}else{
						create(db, req.session.username, req.body.name, req.body.borough, req.body.cuisine, req.body.street, req.body.building, req.body.zipcode, req.body.lon, req.body.lat, req.files.sampleFile,
							function (result) {
								db.close();
								if (result.insertedId != null) {
									res.status(200);
									res.redirect('/');
								} else {
									res.status(500);
									res.end(JSON.stringify(result));
								}
							}
						);
					}

				}

			} else {
				console.log(req.body.name +' is existed alredy.')
				res.redirect('/new');
			}
		});
	});
});

function create(db, owner, name, borough, cuisine, street, building, zipcode, lon, lat, bfile, callback) {
	db.collection('res').insertOne({
		"owner": owner,
		"borough": borough,
		"name": name,
		"cuisine": cuisine,
		"street": street,
		"building": building,
		"zipcode": zipcode,
		"coor": [lon, lat],
		"data": new Buffer(bfile.data).toString('base64'),
		"mimetype": bfile.mimetype	
	},	
		function (err, result) {
			if (err) {
				result = err;
				console.log("insertOne error: " + JSON.stringify(err));
			} else {
				console.log("status : upload OK, _id :" + result.insertedId);
			}
			callback(result);
		}
	);
}

function createWithoutFile(db, owner, name, borough, cuisine, street, building, zipcode, lon, lat, callback) {
	db.collection('res').insertOne({
		"owner": owner,
		"borough": borough,
		"name": name,
		"cuisine": cuisine,
		"street": street,
		"building": building,
		"zipcode": zipcode,
		"coor": [lon, lat],
		//"data": new Buffer(bfile.data).toString('base64'),
		//"mimetype": bfile.mimetype
	},
		function (err, result) {
			if (err) {
				result = err;
				console.log("insertOne error: " + JSON.stringify(err));
			} else {
				console.log("status : upload OK, _id :" + result.insertedId);
			}
			callback(result);
		}
	);
}

function findOneRestaurant(db, criteria, callback) {
	db.collection('res').findOne(criteria, function (err, result) {
		assert.equal(err, null);
		callback(result);
	}
	);
}

//3.1 update restaurnat documents
app.get('/update', function (req, res) {
	if (!req.session.authenticated) {
		res.sendFile(__dirname + '/public/login.html');
	}
	else {
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			infoAboutToChange(db, req.query.id, function (result) {
				db.close();
				if (result.owner != req.session.username)
					res.sendFile(__dirname + '/public/error.html');
				else {
					console.log('going to update document' + req.query.id);
					res.render('update.ejs', { result: result });
				}
			}
			);
		});
	}
});

function infoAboutToChange(db, target, callback) {
	db.collection('res').findOne({ "_id": ObjectId(target) }, function (err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

app.post('/update', function (req, res) {
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(null, err);

		if (req.body.borough == null || req.body.borough == '') {
			req.body.borough = "";
		}
		if (req.body.cuisine == null || req.body.cuisine == '') {
			req.body.cuisine = "";
		}
		if (req.body.street == null || req.body.street == '') {
			req.body.street = "";
		}
		if (req.body.building == null || req.body.building == '') {
			req.body.building = "";
		}
		if (req.body.zipcode == null || req.body.zipcode == '') {
			req.body.zipcode = "";
		}
		if (req.body.lon == null || req.body.lon == '') {
			req.body.lon = "";
		}
		if (req.body.lat == null || req.body.lat == '') {
			req.body.lat = "";
		}
		if (req.files.sampleFile){
			if(req.files.sampleFile.mimetype != 'image/png' && req.files.sampleFile.mimetype != 'image/jpg' ){
				console.log('file type error, return to /read');
				res.redirect('/read');
			}else{
				commitChange(db, req.body.id, req.body.name, req.body.borough, req.body.cuisine, req.body.street, req.body.building, req.body.zipcode, req.body.lon, req.body.lat, req.files.sampleFile,
					function (result) {
						db.close();
						res.status(200);
						res.redirect('/detail?id=' + req.body.id);
					}
				);
			}
		}else{
			commitChange(db, req.body.id, req.body.name, req.body.borough, req.body.cuisine, req.body.street, req.body.building, req.body.zipcode, req.body.lon, req.body.lat, req.files.sampleFile,
				function (result) {
					db.close();
					res.status(200);
					res.redirect('/detail?id=' + req.body.id);
				}
			);
		}

	});
});



function commitChange(db, id, name, borough, cuisine, street, building, zipcode, lon, lat, bfile, callback) {
	if (bfile != undefined) {
		db.collection('res').update({ "_id": ObjectId(id) }, {
			$set: {
				"name": name,
				"borough": borough,
				"cuisine": cuisine,
				"street": street,
				"building": building,
				"zipcode": zipcode,
				"coor": [lon, lat],
				"data": new Buffer(bfile.data).toString('base64'),
				"mimetype": bfile.mimetype
			}
		}, function (err, result) {
			if (err) {
				result = err;
				console.log("insertOne error: " + JSON.stringify(err));
			} else {
				callback(result);
			}
		}
		);
	} else {
		db.collection('res').update({ "_id": ObjectId(id) }, {
			$set: {
				"name": name,
				"borough": borough,
				"cuisine": cuisine,
				"street": street,
				"building": building,
				"coor": [lon, lat]
			}
		}, function (err, result) {
			if (err) {
				result = err;
				console.log("insertOne error: " + JSON.stringify(err));
			} else {
				callback(result);
			}

		}
		);
	}
}

//4.1Rate Restaurant
app.post('/rate', function (req, res) {
	var resID = req.body.id;
	var resScore = req.body.score;
	var rateOwner = req.session.username;
	//var criteria =  {_id:req.body.id,rate:{$elemMatch:{owner:req.session.username}}};
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(err, null);
		findRateUser(db,req.body.id,req.session.username,function(result){
			console.log(JSON.stringify(result));
			if (result == null) {
				console.log('inserting rate for'+resID+','+resScore+','+rateOwner);
				addRate(db, resID, resScore, rateOwner,
					function (result) {
						db.close();
						res.redirect('/read');
					}
				);
			}else{
				res.sendFile(__dirname + '/public/errorRate.html');
			}
		});
	});
});

app.get('/rate', function (req, res) {
	if (!req.session.authenticated) {
		res.sendFile(__dirname + '/public/login.html');
	} else {
		var resID = req.query.id;
		res.render('rate.ejs', { res: resID });
	}
});

function findRateUser(db,resID,rateOwner,callback){
	db.collection('res').findOne({"_id":ObjectId(resID),"rate":{$elemMatch:{"owner":rateOwner}}},
		function (err, result){
			if(err){
				result = err;
				console.log("update: " + JSON.stringify(err));
			}
			callback(result);
		}
	);
}

function addRate(db, resID, resScore, rateOwner, callback) {
	db.collection('res').update(
		{ "_id": ObjectId(resID) },
		{$push:{rate: {score: resScore,	owner: rateOwner}}},
		 function (err, result) {
			if (err) {
				result = err;
				console.log("update: " + JSON.stringify(err));
			}
			callback(result);
		}
	);
}

//5. Display restauratn documents
app.get('/read', function (req, res) {
	if (req.session.authenticated == false || req.session.authenticated == undefined) {
		res.sendFile(__dirname + '/public/login.html');
	}
	else {
		var criteria = req.query;
		console.log("Authenticated: " + req.session.authenticated + ", Username: " + req.session.username);
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to Database');
			findRestaurant(db, criteria, function (dbres) {
				db.close();
				res.render('listing.ejs', { res: dbres, user: req.session.username, criteria: JSON.stringify(criteria) });
			});
		});
	}
});

function findRestaurant(db, criteria, callback) {
	var dbres = [];
	db.collection('res').find(criteria, function (err, result) {
		assert.equal(err, null);
		result.each(function (err, doc) {
			if (doc != null) {
				dbres.push(doc);
			} else {
				callback(dbres);
			}
		});
	})
}

//detail
//
app.get('/detail', function (req, res) {
	if (!req.session.authenticated) {
		res.sendFile(__dirname + '/public/login.html');
	} else {
		var target = req.query.id;
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			findDetail(db, target, function (dbres) {
				db.close();
				res.render('showDetail.ejs', { restaurant: dbres });
			});
		});
	}
});

function findDetail(db, target, callback) {
	db.collection('res').findOne({ "_id": ObjectId(target) }, function (err, result) {
		assert.equal(err, null);
		callback(result);
	});
}

app.get('/gmap', function (req, res) {
	if (!req.session.authenticated) {
		res.sendFile(__dirname + '/public/login.html');
	} else {
		var lat = req.query.lat;
		var lon = req.query.lon;
		var title = req.query.title;
		res.render("map.ejs", { lat:lat, lon:lon, title:title });
	}
});



//6. Delete restaurant documents
app.get('/delete', function (req, res, callback) {
	if (!req.session.authenticated) {
		res.sendFile(__dirname + '/public/login.html');
	}
	else {
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(null, err);
			DBDelete(db, req.query.id, req.session.username,
				function (result) {
					db.close();
					if (result.result.n == 1)
						res.redirect('/');
					else
						res.sendFile(__dirname + '/public/error.html');
				}
			);
		});
	}
});

function DBDelete(db, target, owner, callback) {
	db.collection('res').remove({ "_id": ObjectId(target), "owner": owner },
		function (err, result) {
			if (err) { result = err; }
			callback(result);
		}
	);
}

//7. search
app.get('/Filtering', function (req, res) {
		res.sendFile(__dirname + '/public/search.html');
});

app.post('/Filtering', function (req, res) {
	var criteria = { "name": req.body.name };
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(null, err);
		findUser(db, criteria, function (result) {
			if (result == null) {
				createUser(db, req.body.name, req.body.password,
					function (result) {
						db.close();
						res.redirect('/');
					}
				);
				console.log('User ' + req.body.name + ' with passcode:' + req.body.password + ' create successful.');
			}
			else {
				res.redirect('/register');
				console.log('User ' + req.body.name + ' exist.');
			}
		});
	});
});


app.get('/api/restaurant/read/:field/:value', function (req, res) {
	if (!req.session.authenticated) {
		res.sendFile(__dirname + '/public/login.html');
	} else {
		var criteria = req.query;
		console.log("Authenticated: " + req.session.authenticated + ", Username: " + req.session.username);
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			var field = req.params.field;
			var value = req.params.value;
			var criteria;
			if (field == "name") {
				criteria = { "name": value };
			} else if (field == "borough") {
				criteria = { "borough": value };
			} else if (field == "cuisine") {
				criteria == { "cuisine": value };
			}
			console.log('Connected to Database');
			console.log("Restaurant in:" + value);
			findRestaurant(db, criteria, function (dbres) {
				db.close();
				res.end(JSON.stringify(dbres));
			});
		});
	}
});

app.post('/api/restaurant/create',function(req,res){
    var inObj = req.body;
    var resObj;
    MongoClient.connect(mongourl,function(err,db) {
        assert.equal(err,null);
        console.log('Connected to MongoDB\n');
        insertRestaurant(db,inObj,function(id) {
            db.close();
            if(id!==undefined||id!==null){
                resObj = {
                    status : "ok",
                    _id: id
                };
                res.end(JSON.stringify(resObj));
            }else{
                resObj = {
                    status : "failed"
                };
                res.end(JSON.stringify(resObj));
            }
        });
    });
});

function insertRestaurant(db,r,callback) {
    db.collection('restaurants').insertOne(r,function(err,result) {
        assert.equal(err,null);
        callback(r._id);
    });
}


app.listen(process.env.PORT || 8099, function () {
	console.log('server is running on 8099...');
});
