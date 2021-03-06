const {db} = require("../utils/admin");
const {
  isEmpty,
  validatePhoneNumber,
} = require("../utils/validators");
const {options} = require("../utils/assets");

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
    userHandle: req.user.handle,
  };

  newRestaurant.body = (!req.body.body || isEmpty(req.body.body)) ? "" : req.body.body;
  newRestaurant.phone = (!req.body.phone || isEmpty(req.body.phone)) ? "" : req.body.phone;

  // Check if restaurant with same name exists
  db.collection("restaurants")
      .where("locId", "==", req.body.locId)
      .get()
      .then((resData) => {
        resData.forEach((resDoc) => {
          if (resDoc.data().name.trim().toLowerCase() ===
              req.body.name.trim().toLowerCase()) {
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
        return user.ref.update({resCount: user.data().resCount + 1});
      })
      .then(() => {
        return db.doc(`/locations/${req.body.locId}`).get();
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

// Fetch restaurant
exports.getRestaurant = (req, res) => {
  const resData = {};
  db.doc(`/restaurants/${req.params.resId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Restaurant not found"});
        }
        resData.restaurant = doc.data();
        resData.resId = doc.id;
        return db
            .collection("dishes")
            .where("resId", "==", doc.id)
            .orderBy("createdAt", "desc")
            .get();
      })
      .then((dishes) => {
        resData.dishes = [];
        dishes.forEach((dish) => {
          resData.dishes.push(dish.data());
        });
        return res.json(resData);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
      });
};

// Delete a restaurant
exports.deleteRestaurant = (req, res) => {
  const batch = db.batch();
  db.doc(`/restaurants/${req.params.resId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Restaurant not found"});
        } else if (doc.data().userHandle !== req.user.handle) {
          return res.status(403).json({error: "Unauthorized"});
        } else {
          batch.delete(doc.ref);
          return db.collection("dishes")
              .where("resId", "==", req.params.resId)
              .get();
        }
      })
      .then((dishes) => {
        dishes.forEach((dish) => batch.delete(dish.ref));
        return db.doc(`/users/${req.user.handle}`)
            .get();
      })
      .then((user) => {
        if (!user.exists) {
          return res.status(404).json({error: "User not found"});
        }
        return batch.update(user.ref, {resCount: user.data().resCount - 1});
      })
      .then(() => {
        return batch.commit();
      })
      .then(() => {
        return res.json({message: "Restaurant successfully deleted"});
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

// Update a phone number
exports.updatePhone = (req, res) => {
  // const {errors, valid} = validatePhoneNumber(req.body.phone);
  // if (!valid) return res.status(400).json(errors);

  if (isEmpty(req.body.phone)) {
    return res.status(400).json({restaurant: "Phone cannot be empty"});
  }

  let resData;
  db.doc(`/restaurants/${req.params.resId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Restaurant not found"});
        }
        resData = doc.data();
        return doc.ref.update({phone: req.body.number});
      })
      .then(() => {
        resData.phone = req.body.number;
        return res.json(resData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};
