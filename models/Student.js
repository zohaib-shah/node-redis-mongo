var mongoose = require("mongoose");

var StudentSchema = new mongoose.Schema({
   first_name : String,
   last_name : String,
   class : String,
   age : Number
},{timestamps: true});

var Student = mongoose.model('Student', StudentSchema);

module.exports = Student;