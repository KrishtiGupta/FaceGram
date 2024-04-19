var mongoose= require("mongoose");

var postSchema= mongoose.Schema({
    caption:String,
    user:String,
    photo:String,
    like:{
        type:Array,
        default:[]
    },
    savedby:{
        type:Array,
        default:[]
    },
    postby:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    comments:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment",
    }]
})


module.exports = mongoose.model("posts",postSchema);