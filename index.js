const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const User = require("./models/User.js");
const Place=require("./models/places");
require("dotenv").config();//setting configuration for accing env files
const cookieParser=require("cookie-parser");
const download = require('image-downloader');
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret='iworirjwkngkeajngoiut';

app.use(express.json());//setting middleware for json
app.use(cookieParser());//setting middleware for cookies
app.use('/uploads',express.static(__dirname+'/uploads'));//setting up middileware to access images downloaded by "image-downloader"
const BASE_URL=process.env.BASE_URL;
const PORT=process.env.PORT || 5000;


const corsOptions = {
  origin:BASE_URL, //access-control-allow-origin
  credentials: true, //access-control-allow-credentials:tru
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions)); //setting middleware for cors error
mongoose.connect(process.env.MONGO_URL); //mongo connection

app.get("/test", (req, res) => {
  res.send(process.env.MONGO_URL);
});

app.post("/register", async (req, res) => {
  // mongoose.connect(process.env.MONGO_URL);
  const { name, email, password } = req.body;

  try {
    const userDoc = await User.create({
      name,
      email,
      password:bcrypt.hashSync(password, bcryptSalt), //encrepting passward using hashsync
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post("/login",async (req,res)=>{
  const{lname,lpass}=req.body;
  const resultDoc= await User.findOne({email:lname});
  if(resultDoc)
  {
    const passok=bcrypt.compareSync(lpass,resultDoc.password);
    if(passok)
    {
      jwt.sign({email:resultDoc.email,
        id:resultDoc._id,
        name:resultDoc.name
    },  jwtSecret, {}, (err,token) => {
        if (err) throw err;
        res.cookie('token',token).json(resultDoc);
      })
    }
    else
    {
      res.status(422).json("unfortunitely notfound");
    }
  }
  else
  {
    res.json("not found");
  }

})


app.get('/profile', (req, res) => {

  const {token}=req.cookies; // should print cookies sent by the client
    if(token)
      {
        jwt.verify(token,jwtSecret,{},async (err,user)=>{
           if(err) throw err;
           const userDoc=await User.findById(user.id);
           res.json(userDoc);
        });
      }
      else
      {
         res.json(null);
      }
  
  // res.send(token);
});

app.post('/logout',(req,res)=>{
   res.cookie('type','').json(true);
})

app.post('/registerPlace',(req,res)=>{

  const{title,address,addedPhotos,description,einfo,checkin,checkout,guest,perks}=req.body;
  try{
    const {token}=req.cookies;
    let owner_name="";
    if(token)
    {
      jwt.verify(token,jwtSecret,{},async (err,user)=>{
         if(err) throw err;
         console.log("user value",user)
         owner_name=user.name;
         console.log("owner_name is",owner_name);
      });
    }
    const placeDoc=Place.create({
      owner:owner_name,
      title:title,
      address:address,
      photos:addedPhotos,
      description:description,
      perks:perks,
      extraInfo:einfo,
      checkin:checkin,
      checkout:checkout,
      maxGuest:guest,
    })
    res.json(placeDoc);
  }
  catch(e)
  {
     res.json(e);
  }
})


app.get('/addedplace', (req, res) => {

  const {token}=req.cookies; // should print cookies sent by the client
    if(token)
      {
        jwt.verify(token,jwtSecret,{},async (err,user)=>{
           if(err) throw err;
           const userDoc=await Place.find({owner:user.name});
           console.log("filtered places",userDoc);
           res.json(userDoc);
        });
      }
      else
      {
         res.json(null);
      }
});


//in photos we are using image-downloader library which is used to download image with the help of their url and then they are saved into given directory
app.post('/photos',async(req,res)=>{
  const {link}=req.body;
  const newName='photos'+Date.now()+'.jpg';
  await download.image({
    url:link,  //url of an image
    dest:__dirname+'/uploads/'+newName,//path of destinatiion folder
  });
  res.json(newName);//sending json response
})



app.listen(PORT, () => {
  console.log("listening port 5000");
});








//& notes

// *The useParams hook returns an object of key/value pairs of the dynamic params from the current URL that were matched by the <Route path>. Child routes inherit all params from their parent routes.