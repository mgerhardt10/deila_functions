const {db} = require("../utils/admin");
const {
  isEmpty,
} = require("../utils/validators");

// Add a new dish
exports.postNewDish = (req, res) => {
  if (isEmpty(req.body.name)) {
    return res.status(400).json({dish: "Name cannot be empty"});
  }

  if (isEmpty(req.body.resId)) {
    return res.status(400).json({dish: "ResId cannot be empty"});
  }

  const newDish = {
    resId: req.body.resId,
    createdAt: new Date().toISOString(),
    name: req.body.name,
    star: false,
  };

  newDish.body = isEmpty(req.body.body) ? "" : req.body.body;

  // Check if dish with same name exists
  db.collection("dishes")
      .where("resId", "==", req.body.resId)
      .get()
      .then((dishes) => {
        dishes.forEach((dish) => {
          if (dish.data().name.trim().toLowerCase() ===
                    req.body.name.trim().toLowerCase()) {
            return res.status(400).json({error: "Dish already exists"});
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
        return user.ref.update({dishCount: user.data().dishCount + 1});
      })
      .then(() => {
        return db.doc(`/restaurants/${req.body.resId}`).get();
      })
      .then((resDoc) => {
        if (!resDoc.exists) {
          return res.status(404).json({error: "Restaurant not found"});
        }
        return db.collection("dishes").add(newDish);
      })
      .then((dish) => {
        const resDish = newDish;
        resDish.dishId = dish.id;
        res.json(resDish);
      })
      .catch((err) => {
        res.status(500).json({error: "Something went wrong"});
        console.error(err);
      });
};

// Fetch dish
exports.getDish = (req, res) => {
  const dishData = {};
  db.doc(`/dishes/${req.params.dishId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Dish not found"});
        }
        dishData.dish = doc.data();
        dishData.dishId = doc.id;
        return res.json(dishData);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
      });
};

// Delete a dish
exports.deleteDish = (req, res) => {
  const batch = db.batch();
  let dishDoc;
  db.doc(`/dishes/${req.params.dishId}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Dish not found"});
        } else {
          dishDoc = doc;
          return db.doc(`/restaurants/${doc.data().resId}`).get();
        }
      })
      .then((resDoc) => {
        if (!resDoc.exists) {
          return res.status(404).json({error: "Restaurant not found"});
        } else {
          return db.doc(`/locations/${resDoc.data().locId}`).get();
        }
      })
      .then((locDoc) => {
        if (!locDoc.exists) {
          return res.status(404).json({error: "Location not found"});
        } else if (locDoc.data().userHandle !== req.user.handle) {
          return res.status(403).json({error: "Unauthorized"});
        } else {
          batch.delete(dishDoc.ref);
          return db.doc(`/users/${req.user.handle}`)
              .get();
        }
      })
      .then((user) => {
        if (!user.exists) {
          return res.status(404).json({error: "User not found"});
        }
        return batch.update(user.ref, {dishCount: user.data().dishCount - 1});
      })
      .then(() => {
        return batch.commit();
      })
      .then(() => {
        return res.json({message: "Dish successfully deleted"});
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};
