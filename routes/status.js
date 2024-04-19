var mongoose= require("mongoose");

var statusSchema= mongoose.Schema({
    name:String,
    user: String,
    image: String
})


module.exports = mongoose.model("status",statusSchema);