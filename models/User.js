// const mongoose = require("mongoose");


// const UserSchema = new mongoose.Schema({
//   name: String,
//   email: {
//     type: String,
//     unique: true,
//   },
//   passward:{
//     type:String,
//     require:true,
//   }
// });

// const UserModel = mongoose.model("User", UserSchema);
// //first param =model name
// //second param=definde schema

// module.exports=UserModel;


const mongoose = require('mongoose');
const {Schema} = mongoose;

const UserSchema = new Schema({
  name: String,
  email: {type:String, unique:true},
  password: String,
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;