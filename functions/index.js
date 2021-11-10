const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./utils/fbAuth");

const cors = require("cors");
app.use(cors());

const {db} = require("./utils/admin");

const {
  signup,
  login,
  uploadImage,
  getAuthenticatedUser,
} = require("./handlers/users");

const {
  postNewLocation,
  getLocation,
  updateLocStar,
  deleteLocation,
} = require("./handlers/locations");
const {postNewRestaurant, getRestaurant, updateResStar} = require("./handlers/restaurants");

// Login Routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.get("/user", FBAuth, getAuthenticatedUser);

// Location Routes
app.post("/locations", FBAuth, postNewLocation);
app.get("/locations/:locId", FBAuth, getLocation);
app.post("/locations/:locId/star", FBAuth, updateLocStar);
app.delete("/locations/:locId", FBAuth, deleteLocation);

// Restaurant Routes
app.post("/restaurants", FBAuth, postNewRestaurant);
app.get("/restaurants/:resId", FBAuth, getRestaurant);
app.post("/restaurants/:resId/star", FBAuth, updateResStar);

exports.api = functions.region("us-central1").https.onRequest(app);


