var express = require('express');
var redis = require('redis');
var router = express.Router();
var Student = require('../models/Student');
var mongoose = require('mongoose');
var config = require('../config.json');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/add-student', (req, res, next)=>{
mongoose.connect("mongodb://"+config.mongo_host+":"+config.mongo_port+"/"+config.mongo_db, {useNewUrlParser: true, useUnifiedTopology: true}, async(err) => {  
  var students = await Student.find({}).exec();
  res.render('student', { title: 'Add Student', students : students });
});

});

router.get('/edit-student/:std_id', (req, res, next)=>{
//first try to fetch from redis
var client = redis.createClient({host:config.redis_host,port:config.redis_port});
client.get("st-"+req.params.std_id, function(rd_err, rd_result) {
    if (rd_err){//if error occured or key doesnt exist
    	//fetch from DB
    	mongoose.connect("mongodb://"+config.mongo_host+":"+config.mongo_port+"/"+config.mongo_db, {useNewUrlParser: true, useUnifiedTopology: true}, async(err) => {  
  var st = await Student.findById(req.params.std_id).exec();
  res.render('edit_student', { title: 'Edit Student', st : st , source : 'Mongo DB' });
});
    } else {
  			//console.log(rd_result);  	
  			var st = Student.hydrate(JSON.parse(rd_result));
  			console.log(st);
  			res.render('edit_student', { title: 'Edit Student', st : st , source : 'Redis Cache' });
    }


});
});

router.post('/post-student', function(req, res, next) {
  console.log(req.body);
  mongoose.connect("mongodb://"+config.mongo_host+":"+config.mongo_port+"/"+config.mongo_db, {useNewUrlParser: true, useUnifiedTopology: true}, async(err) => {
  if(!err){
  	if(typeof req.body.student_id !== 'undefined'){
  var st = await Student.findById(req.body.student_id).exec();
  	st.first_name = req.body.first_name;
  	st.last_name = req.body.last_name;
  	st.class = req.body.class;
  	st.age = req.body.age;
  st.save(()=>{
  	console.log("Student has been Updated");
  	var client = redis.createClient({host:config.redis_host,port:config.redis_port});
	client.set(['st-'+st.id,JSON.stringify(st.toJSON())],(err,reply)=>{
		if (err) throw err;
		console.log(reply);
	});
  	res.redirect('/add-student');
  });         
  } else {
  var st = new Student({
  	first_name : req.body.first_name,
  	last_name : req.body.last_name,
  	class : req.body.class,
  	age : req.body.age
  });
  st.save(()=>{
  	console.log("Student has been saved");
  	var client = redis.createClient({host:config.redis_host,port:config.redis_port});
	client.set(['st-'+st.id,JSON.stringify(st.toJSON())],(err,reply)=>{
		if (err) throw err;
		console.log(reply);
	});
  	res.redirect('/add-student');
  });
}
	} else {
		console.log("Can  not connect with DB");
	}
});
  
});

module.exports = router;
