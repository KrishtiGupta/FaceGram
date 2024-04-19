var mongoose= require("mongoose");

var commentSchema= mongoose.Schema({
    fromuser:String,
    byuser:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    comment:String,
    touser:String
})


module.exports = mongoose.model("comment",commentSchema);