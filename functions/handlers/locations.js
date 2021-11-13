const {db} = require("../utils/admin");
const {
  validateLocation,
  isEmpty,
} = require("../utils/validators");

// Post a location
exports.postNewLocation = (req, res) => {
  const newLocation = {
    userHandle: req.user.handle,
    city: req.body.city,
    country: req.body.country,
    createdAt: new Date().toISOString(),
    star: false,
  };

  newLocation.state = (!req.body.state || isEmpty(req.body.state)) ? "" : req.body.state;

  const {errors, valid} = validateLocation(newLocation);

  if (!valid) return res.status(400).json(errors);

  let resLocation;
  // Check if location with same name exists
  db.collection("locations")
      .where("userHandle", "==", req.user.handle)
      .get()
      .then((locData) => {
        locData.forEach((loc) => {
          if (loc.data().city.trim().toLowerCase() ===
                  req.body.city.trim().toLowerCase()) {
            return res.status(400).json({error: "City already exists"});
          }
        });
        return db.doc(`/users/${req.user.handle}`)
            .get();
      })
      .then((user) => {
        if (!user.exists) {
          return res.status(404).json({error: "User not found"});
        }
        return user.ref.update({locCount: user.data().locCount + 1});
      })
      .then(() => {
        // Add new location
        return db.collection("locations")
            .add(newLocation);
      })
      .then((doc) => {
        resLocation = newLocation;
        resLocation.locId = doc.id;
        return res.json(resLocation);
      })
      .catch((err) => {
        res.status(500).json({error: "Something went wrong"});
        console.error(err);
      });
};

// Fetch one location
exports.getLocation = (req, res) => {
  const locData = {};
  db.doc(`/locations/${req.params.locId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Location not found"});
        }
        locData.location = doc.data();
        locData.locId = doc.id;
        return db
            .collection("restaurants")
            .where("locId", "==", doc.id)
            .orderBy("createdAt", "desc")
            .get();
      })
      .then((resData) => {
        locData.restaurants = [];
        resData.forEach((resDoc) => {
          locData.restaurants.push({
            name: resDoc.data().name,
            body: resDoc.data().body,
            phone: resDoc.data().phone,
            address: resDoc.data().address,
            createdAt: resDoc.data().createdAt,
            star: resDoc.data().star,
            resId: resDoc.id,
            userHandle: resDoc.data().userHandle,
          });
        });
        return res.json(locData);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
      });
};

// Delete a location
exports.deleteLocation = (req, res) => {
  const batch = db.batch();
  db.doc(`/locations/${req.params.locId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Location not found"});
        } else if (doc.data().userHandle !== req.user.handle) {
          return res.status(403).json({error: "Unauthorized"});
        } else {
          batch.delete(doc.ref);
          return db.collection("restaurants")
              .where("locId", "==", req.params.locId)
              .get();
        }
      })
      .then((restaurants) => {
        restaurants.forEach((restaurant) => {
          db.collection("dishes")
              .where("resId", "==", restaurant.id)
              .get()
              .then((data) => {
                data.forEach((dish) => batch.delete(dish.ref));
              });
          batch.delete(restaurant.ref);
        });
        return db.doc(`/users/${req.user.handle}`)
            .get();
      })
      .then((user) => {
        if (!user.exists) {
          return res.status(404).json({error: "User not found"});
        }
        return batch.update(user.ref, {locCount: user.data().locCount - 1});
      })
      .then(() => {
        return batch.commit();
      })
      .then(() => {
        return res.json({message: "Location successfully deleted"});
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

