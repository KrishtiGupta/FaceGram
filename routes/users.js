var mongoose= require("mongoose");
var plm= require("passport-local-mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/dbase1");

var userSchema= mongoose.Schema({
  fullname:String,
  username:String,
  password:String,
  email:String,
  profile:{
    type:String,
    default:"default.jpg"
  },
  status:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "status",
  }],
  post:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "posts"
  }],
  bio:{
    type:String,
    default:"hello user!"
  },
  followers:{
    type: Array,
    default:[]
  },
  following:{
    type: Array,
    default:[]
  }
})

userSchema.plugin(plm);
module.exports = mongoose.model("users",userSchema);

