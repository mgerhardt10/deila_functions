const {db} = require("../utils/admin");
const {
  isEmpty,
} = require("../utils/validators");

// Add a new resturant
exports.postNewRestaurant = (req, res) => {
  if (isEmpty(req.body.name)) {
    return res.status(400).json({restaurant: "Name cannot be empty"});
  }

  if (isEmpty(req.body.locId)) {
    return res.status(400).json({restaurant: "LocId cannot be empty"});
  }

  const newRestaurant = {
    locId: req.body.locId,
    createdAt: new Date().toISOString(),
    name: req.body.name,
    star: false,
    address: "",
    phone: "",
  };

  newRestaurant.body = isEmpty(req.body.body) ? "" : req.body.body;

  // Check if location with same name exists
  db.collection("restaurants")
      .where("locId", "==", req.body.locId)
      .get()
      .then((resData) => {
        resData.forEach((resDoc) => {
          if (resDoc.data().name.trim().toLowerCase() === req.body.name.trim().toLowerCase()) {
            return res.status(400).json({error: "Restaurant already exists"});
          }
        });
        // if not, get user
        return db.doc(`/users/${req.user.handle}`)
            .get();
      })
      .then((user) => {
        if (!user.exists) {
          return res.status(404).json({error: "User not found"});
        }
        user.ref.update({resCount: user.data().resCount + 1});
        return db.collection("locations")
            .where("locId", "==", req.body.locId)
            .where("userHandle", "==", req.user.handle)
            .limit(1)
            .get();
      })
      .then((loc) => {
        if (!loc.exists) {
          return res.status(404).json({error: "Location not found"});
        }
        return db.collection("restaurants").add(newRestaurant);
      })
      .then((restaurant) => {
        const resRes = newRestaurant;
        resRes.resId = restaurant.id;
        res.json(resRes);
      })
      .catch((err) => {
        res.status(500).json({error: "Something went wrong"});
        console.error(err);
      });
};

// Get a restaurant
exports.getRestaurant = (req, res) => {
  if (isEmpty(req.body.locId)) {
    return res.status(400).json({restaurant: "LocId cannot be empty"});
  }

  db.collection("restaurants")
      .where("resId", "==", req.params.resId)
      .where("locId", "==", req.body.locId)
      .limit(1)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Restaurant not found"});
        }
        return res.json(doc);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
      });
};

// Delete a restaurant
exports.deleteRestaurant = (req, res) => {
  // Verify user then delete
  db.doc(`/users/${req.user.handle}`)
      .get()
      .then((user) => {
        if (!user.exists) {
          return res.status(404).json({error: "User not found"});
        }
        user.ref.update({resCount: user.data().resCount - 1});
        return db.collection("restaurants")
            .where("resId", "==", req.params.resId)
            .where("locId", "==", req.params.locId)
            .limit(1)
            .get();
      })
      .then((restaurant) => {
        if (!restaurant.exists) {
          return res.status(404).json({error: "Restaurant not found"});
        }
        return restaurant.delete();
      })
      .then(() => {
        res.json({message: "Restaurant deleted successfully"});
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

// Star/Unstar a restaurant
exports.updateResStar = (req, res) => {
  let resData;

  if (isEmpty(req.body.locId)) {
    return res.status(400).json({restaurant: "LocId cannot be empty"});
  }

  db.collection("restaurants")
      .where("resId", "==", req.params.resId)
      .where("locId", "==", req.body.locId)
      .limit(1)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Restaurant not found"});
        }
        resData = doc.data();
        return doc.ref.update({star: !doc.data().star});
      })
      .then(() => {
        resData.star = !resData.star;
        return res.json(resData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

// Update a restaurant
exports.updateRestaurant = (req, res) => {
  // If starred is not specified, body must have content
  if (isEmpty(req.body.body) && req.body.star === null) {
    return res.status(404).json({error: "Body cannot be empty"});
  }

  if (isEmpty(req.body.resId)) {
    return res.status(400).json({dish: "ResId cannot be empty"});
  }

  db.collection("dishes")
      .where("dishId", "==", req.params.dishId)
      .where("resId", "==", req.body.resId)
      .limit(1)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Dish not found"});
        }
        // If star has been changed
        if (doc.data().star !== req.body.star && req.body.star !== null) {
          doc.ref.update({star: req.body.star});
        }
        // If body has changed
        if (!isEmpty(req.body.body)) {
          doc.ref.update({body: req.body.body});
        }
        return res.json(doc.data());
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};
