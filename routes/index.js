var express = require('express');
var router = express.Router();
var userModel=require('./users');
var postModel=require('./posts');
var statusModel=require("./status");
var commentModel=require("./comment");


const passport= require('passport');
const localStrategy=require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));

const multer=require('multer');
var path= require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const dt= new Date();
    const fn=dt.getTime() + Math.floor(Math.random()*100000000)+ path.extname(file.originalname);
    cb(null, fn);
  }
})

function fileFilter (req, file, cb) {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/webp' || file.mimetype === 'image/svg')
  {
    cb(null, true)
  }
  else
  {
    cb(new Error('I don\'t have a clue!'))
  }
}

const upload = multer({ storage: storage, fileFilter:fileFilter })


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
// ----------------under development redirected page---------------
router.get('/underdev', function(req, res, next) {
  res.render('Underdev');
});
// --------user create krne wala route---------------------
router.post('/create',async function(req, res, next){
  var newUser= new userModel({
    fullname:req.body.fullname,
    username:req.body.username,
    email:req.body.email
  })
  await userModel.register(newUser, req.body.password);
  passport.authenticate('local')(req, res, function(){
    res.redirect('/profile')
  })
})

// --------profile page pr phuchane wala route---------------------
router.get('/profile',isLoggedIn, async function(req, res, next) {
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  var statuses = (await statusModel.find()).reverse();
  // console.log(loggedinuser);
  var posts=(await postModel.find()).reverse();
  res.render('profile', {loggedinuser,posts,statuses});
});


// profile image change krne  wala route
router.post('/change',isLoggedIn, upload.single("image"), async function(req,res){
  // res.send("photo upload hua")
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  loggedinuser.profile=req.file.filename;
  await loggedinuser.save();
  res.redirect("back");
})


// ---------post karane wala form open karega
router.get('/postupload',isLoggedIn,async function(req,res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  res.render('uploadpost',{loggedinuser});
})


// post karane wala route
router.post("/uploadpost",isLoggedIn, upload.single("post"), async function(req,res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  var newpost = await postModel.create({
    caption:req.body.caption,
    photo:req.file.filename,
    user:loggedinuser.username,
    postby:loggedinuser._id
  })
  loggedinuser.post.push(newpost._id);
  await loggedinuser.save();
  res.redirect("/profile");
})


// --------login page open krne wala route------
router.get('/loggingUser',function(req,res){
  res.render('login');
})

// --------login krne wala route---------------------
router.post('/login',passport.authenticate('local',
{
  successRedirect: '/profile',
  failureredirect:'/'
}),function(req, res, next){});
 

// logout karane wala route
router.get('/logout', function(req, res, next)
{
  req.logout(function(err){
    if(err)
    {
      return next(err);
    }
    else 
    res.redirect('/');
  })
});

// function used for providing authentication(part of passport js) in the page
function isLoggedIn(req, res, next)
{
  if(req.isAuthenticated())
  {
    return next();
  }
  else
  {
    res.redirect('/');
  }
}

// foe showing all users posts
router.get("/feed",isLoggedIn, async function(req,res){
	var posts = (await postModel.find().populate("postby")).reverse();
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  var users = await userModel.find();
  var statuses = (await statusModel.find()).reverse();
  res.render("feed", {posts,loggedinuser,users,statuses});
})

// // like feature
router.get("/like/:id",isLoggedIn,function(req,res){
  postModel.findOne({_id:req.params.id}).then(function(post){
  var indexjispemila=post.like.indexOf(req.session.passport.user);

    if(indexjispemila === -1)
    {
      post.like.push(req.session.passport.user);
    }
    else
    {
      post.like.splice(indexjispemila,1);
    }
    post.save().then(function(){
      res.redirect("back");
    })
  })
})


router.get("/openpost/:id/:num",isLoggedIn,async function(req,res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  var postdetail = await postModel.findOne({_id:req.params.id}).populate("postby");
  var value=req.params.num;
  var allcomment = await commentModel.find().populate("byuser");
  res.render("viewpost",{loggedinuser,postdetail,value,allcomment});
})

// comment karwane wala route

router.post("/addacomment/:comentuser/:id",async function(req,res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  var commenteduser = await userModel.findOne({username:req.params.comentuser});
  var post = await postModel.findOne({_id:req.params.id});
  var newcomment = await commentModel.create({
    fromuser: loggedinuser.username,
    touser: commenteduser.username,
    byuser : loggedinuser._id,
    comment : req.body.comment
  })
  await post.comments.push(newcomment._id);
  await post.save();
  res.redirect("back");
})


// status feature wala route
router.post("/addstatus",upload.single("status"),isLoggedIn,async function(req,res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  var newstatus = await statusModel.create({
    name:req.body.name,
    image:req.file.filename,
    user:loggedinuser.username
  })
  loggedinuser.status.push(newstatus._id);
  await loggedinuser.save();
  res.redirect("back");
})

// loggedin user ke status wala
router.get("/viewstatus/:id",isLoggedIn,async function(req,res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  var statusdetail = await statusModel.findOne({_id:req.params.id});
  res.render("Viewstatus",{statusdetail,loggedinuser})
})


// sabke status feed pe dikhane wala
router.get("/playstatus/:id",isLoggedIn,async function(req,res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  var statusdetail = await statusModel.findOne({_id:req.params.id});
  res.render("playstatus",{statusdetail,loggedinuser})
})


router.get("/save/:id",isLoggedIn,async function(req,res){
  var post = await postModel.findOne({_id:req.params.id});
  var indexjispemila=post.savedby.indexOf(req.session.passport.user);

    if(indexjispemila === -1)
    {
      post.savedby.push(req.session.passport.user);
    }
    else
    {
      post.savedby.splice(indexjispemila,1);
    }
    await post.save();
    res.redirect("back");
})

router.get("/viewsave",isLoggedIn,async function(req,res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
	// var posts = await postModel.find();
	var posts = (await postModel.find().populate("postby")).reverse();
  res.render("viewsaved",{posts,loggedinuser});
})


// follow unfollow karwana wala
router.get("/follow/:username",isLoggedIn,async function(req,res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  var targetuser =await userModel.findOne({username:req.params.username});
  var indexjispemila = loggedinuser.following.indexOf(targetuser.username);
  var followindex = targetuser.followers.indexOf(loggedinuser.username);

  if(indexjispemila === -1)
  {
    loggedinuser.following.push(targetuser.username);
    targetuser.followers.push(loggedinuser.username);
  }
  else
  {
    loggedinuser.following.splice(indexjispemila,1);
    targetuser.followers.splice(followindex,1);
  }
  await loggedinuser.save();
  await targetuser.save();
  res.redirect("back");
})


router.get("/takemeback",function(req,res){
  res.redirect("/profile");
})

router.post("/updateprofile",async function(req, res){
  var loggedinuser =await userModel.findOne({username:req.session.passport.user});
  loggedinuser.fullname=req.body.fullname;
  loggedinuser.bio=req.body.bio;
  await loggedinuser.save();
  res.redirect("/profile");

})

module.exports = router;

