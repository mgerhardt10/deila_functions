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

  newLocation.state = isEmpty(req.body.state) ? "" : req.body.state;

  const {valid, errors} = validateLocation(newLocation);

  if (!valid) return res.status(400).json(errors);

  // Check if location with same name exists
  db.collection("locations")
      .where("userHandle", "==", req.user.handle)
      .get()
      .then((locData) => {
        locData.forEach((loc) => {
          if (loc.data().city.trim().toLowerCase() === req.body.city.trim().toLowerCase()) {
            return res.status(400).json({error: "City already exists"});
          }
        });
        // if not, add new location
        return db.collection("locations")
            .add(newLocation);
      })
      .then((doc) => {
        const resLocation = newLocation;
        resLocation.locId = doc.id;
        db.doc(`/users/${req.user.handle}`)
            .get()
            .then((doc) => {
              if (!doc.exists) {
                return res.status(404).json({error: "User not found"});
              }
              doc.ref.update({locCount: doc.data().locCount + 1});
            });
        res.json(resLocation);
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
          });
        });
        return res.json(locData);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
      });
};

// Star/unstar location star
exports.updateLocStar = (req, res) => {
  let locData;
  db.doc(`/locations/${req.params.locId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Location not found"});
        }
        locData = doc.data();
        return doc.ref.update({star: !doc.data().star});
      })
      .then(() => {
        locData.star = !locData.star;
        return res.json(locData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

// Delete a location
exports.deleteLocation = (req, res) => {
  const document = db.doc(`/locations/${req.params.locId}`);
  document
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Location not found"});
        }
        if (doc.data().userHandle !== req.user.handle) {
          return res.status(403).json({error: "Unauthorized"});
        }
        return document.delete();
      })
      .then(() => {
        return db.collection("restaurants")
            .where("locId", "==", req.params.locId)
            .get();
      })
      .then((resData) => {
        resData.forEach((resDoc) => {
          const dishes = db.collection("dishes")
              .where("resId", "==", resDoc.id)
              .get();
          dishes.forEach((dish) => dish.delete());
          resDoc.delete();
        });
        res.json({message: "Location deleted successfully"});
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};
