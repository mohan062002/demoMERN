const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const User = require("./models/User.js");
const Place = require("./models/places");
const Tample = require("./models/Tample.js");
const Advanture = require("./models/Advanture.js");
require("dotenv").config(); //setting configuration for accing env files
const cookieParser = require("cookie-parser");
const download = require("image-downloader");
const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "iworirjwkngkeajngoiut";

app.use(express.json()); //setting middleware for json
app.use(cookieParser()); //setting middleware for cookies
app.use("/uploads", express.static(__dirname + "/uploads")); //setting up middileware to access images downloaded by "image-downloader"

const BASE_URL=process.env.BASE_URL||"";
const corsOptions = {
  origin:BASE_URL,
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
      password: bcrypt.hashSync(password, bcryptSalt), //encrepting passward using hashsync
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { lname, lpass } = req.body;
  const resultDoc = await User.findOne({ email: lname });
  if (resultDoc) {
    const passok = bcrypt.compareSync(lpass, resultDoc.password);
    if (passok) {
      jwt.sign(
        { email: resultDoc.email, id: resultDoc._id, name: resultDoc.name },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(resultDoc);
        }
      );
    } else {
      res.status(422).json("unfortunitely notfound");
    }
  } else {
    res.json("not found");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies; // should print cookies sent by the client
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if (err) throw err;
      const userDoc = await User.findById(user.id);
      res.json(userDoc);
    });
  } else {
    res.json(null);
  }

  // res.send(token);
});

app.post("/logout", (req, res) => {
  res.cookie("type", "").json(true);
});

app.post("/registerPlace", (req, res) => {
  const {
    title,
    address,
    addedPhotos,
    description,
    einfo,
    checkin,
    checkout,
    guest,
    perks,
  } = req.body;
  try {
    const { token } = req.cookies;
    let owner_name = "";
    if (token) {
      jwt.verify(token, jwtSecret, {}, async (err, user) => {
        if (err) throw err;
        console.log("user value", user);
        owner_name = user.name;
        console.log("owner_name is", owner_name);
      });
    }
    const placeDoc = Place.create({
      owner: owner_name,
      title: title,
      address: address,
      photos: addedPhotos,
      description: description,
      perks: perks,
      extraInfo: einfo,
      checkin: checkin,
      checkout: checkout,
      maxGuest: guest,
    });
    res.json(placeDoc);
  } catch (e) {
    res.json(e);
  }
});

//creating a storage for multer
const storage = multer.diskStorage({
  //assigning the destination of a file
  destination: (req, file, cb) => {
    //cb stands for callback
    cb(null, "uploads");
  },
  //setting the name of a file
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/newplaceinfo", upload.single("image"), async (req, res) => {
  const { sitetype } = req.body;
  if (sitetype === "spiritual") {
    const { title, subtitle, desc, god, state, air, train, bus } = req.body;
    const image = req.file ? req.file.filename : null;
    console.log("image is", image);
    try {
      const userDoc = await Tample.create({
        title: title,
        subtitle: subtitle,
        desc: desc,
        img: image,
        god: god,
        state: state,
        air: air,
        train: train,
        bus: bus,
      });
      userDoc.save();
      res.json(userDoc);
    } catch (e) {
      res.status(422).json(e);
    }
  } else if (sitetype === "advanture") {
    const {
      advanturetype,
      companyname,
      address,
      city,
      astate,
      price,
      available,
    } = req.body;
    console.log(
      advanturetype,
      companyname,
      address,
      city,
      astate,
      price,
      available
    );
    try {
      const userDoc = await Advanture.create({
        AdvantureType: advanturetype,
        companyname: companyname,
        address: address,
        city: city,
        state: astate,
        price: price,
        availableseats: available,
      });
      userDoc.save();
      res.json(userDoc);
    } catch (e) {
      res.status(422).json(e);
    }
  }
});

app.post("/religiousplace", async (req, res) => {
  const val = res.json(await Tample.find());
});

app.post("/religiousbook", async (req, res) => {
  const { id } = req.body;
  const val = await Tample.findById(id);
  console.log(val);
  res.json(val);
});

app.post("/religiousplacebysearch", async (req, res) => {
  const { searchplace, state, region } = req.body;
  console.log(searchplace, state, region);
  const val = await Tample.find({
    $or: [{ title: searchplace }, { state: region }],
  });
  console.log(val);
  res.json(val);
});

app.post("/searchhotels", async (req, res) => {
  const { hname, address, rating } = req.body;
  const userDoc = await Place.find({
    title: hname,
    address: address,
    rating: rating,
  });
  res.json(userDoc);
});

app.post("/tampleinfo", async (req, res) => {
  const { id } = req.body;
  const val = await Tample.findById(id);
  console.log(val);
  res.json(val);
});

app.post("/Advantureplace", async (req, res) => {
  const { subpage } = req.body;
  console.log(subpage);


  const val=await Advanture.find({AdvantureType:subpage});
  console.log(val);
  res.json(val);
});



app.get("/addedplace", (req, res) => {
  const { token } = req.cookies; // should print cookies sent by the client
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, user) => {
      if (err) throw err;
      const userDoc = await Place.find({ owner: user.name });
      console.log("filtered places", userDoc);
      res.json(userDoc);
    });
  } else {
    res.json(null);
  }
});

app.post("/searchplace", async (req, res) => {
  const { search } = req.body;
  console.log(search);
  const userDoc = await Place.find({ address: search });
  console.log("filtered places", userDoc);
  res.json(userDoc);
});

app.get("/mainpage", async (req, res) => {
  res.json(await Place.find());
});

app.get("/places/:id", async (req, res) => {
  //id as a parameter send kela ahe  so req.param use kela ahe
  const { id } = req.params; //jeva pn front end pasun data send kela jayel too {} braces madhech fetch karava
  console.log(id);
  res.json(await Place.findById(id));
});

//in photos we are using image-downloader library which is used to download image with the help of their url and then they are saved into given directory
app.post("/photos", async (req, res) => {
  const { link } = req.body;
  const newName = "photos" + Date.now() + ".jpg";
  await download.image({
    url: link, //url of an image
    dest: __dirname + "/uploads/" + newName, //path of destinatiion folder
  });
  res.json(newName); //sending json response
});

app.listen(5000, () => {
  console.log("listening port from 8000");
});

//& notes

// *The useParams hook returns an object of key/value pairs of the dynamic params from the current URL that were matched by the <Route path>. Child routes inherit all params from their parent routes.
