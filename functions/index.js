const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./utils/fbAuth");

const cors = require("cors");
app.use(cors());

const {
  signup,
  login,
  uploadImage,
  getAuthenticatedUser,
} = require("./handlers/users");

const {
  postNewLocation,
  getLocation,
  deleteLocation,
} = require("./handlers/locations");

const {
  postNewRestaurant,
  getRestaurant,
  deleteRestaurant, updatePhone,
} = require("./handlers/restaurants");

const {
  postNewDish,
  getDish,
  deleteDish,
} = require("./handlers/dishes");

const {
  updateStar,
  updateName,
  updateBody,
} = require("./handlers/edits");

// Login Routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.get("/user", FBAuth, getAuthenticatedUser);

// Location Routes
app.post("/locations", FBAuth, postNewLocation);
app.get("/locations/:locId", FBAuth, getLocation);
app.delete("/locations/:locId", FBAuth, deleteLocation);

// Restaurant Routes
app.post("/restaurants", FBAuth, postNewRestaurant);
app.get("/restaurants/:resId", FBAuth, getRestaurant);
app.delete("/restaurants/:resId", FBAuth, deleteRestaurant);
app.post("/restaurants/:resId/phone", FBAuth, updatePhone);

// Dish Routes
app.post("/dishes", FBAuth, postNewDish);
app.get("/dishes/:dishId", FBAuth, getDish);
app.delete("/dishes/:dishId", FBAuth, deleteDish);

// Shared Edit Routes
app.post("/edit/:id/star", FBAuth, updateStar);
app.post("/edit/:id/name", FBAuth, updateName);
app.post("/edit/:id/body", FBAuth, updateBody);

exports.api = functions.region("us-central1").https.onRequest(app);


