const {db} = require("../utils/admin");
const {
  isEmpty,
} = require("../utils/validators");

exports.postNewDish = (res, req) => {
  if (isEmpty(req.body.name)) {
    return res.status(400).json({dish: "Name cannot be empty"});
  }

  const newDish = {
    resId: req.params.resId,
    createdAt: new Date().toISOString(),
    name: req.body.name,
    body: "",
    star: false,
  };

  // Update user -> find restaurant -> add dish
  db.doc(`/users/${req.user.handle}`)
      .get()
      .then((user) => {
        if (!user.exists) {
          return res.status(404).json({error: "User not found"});
        }
        user.ref.update({dishCount: user.data().dishCount + 1});
        return db.collection("restaurants")
            .where("resId", "==", req.params.resId)
            .limit(1)
            .get();
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
exports.getOneDish = (req, res) => {
  db.collection("dishes")
      .where("dishId", "==", req.params.dishId)
      .where("resId", "==", req.params.resId)
      .limit(1)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Dish not found"});
        }
        return res.json(doc);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
      });
};

// Star/Unstar a restaurant
exports.updateDishStar = (req, res) => {
  let dishData;

  db.collection("dishes")
      .where("dishId", "==", req.params.dishId)
      .where("resId", "==", req.params.resId)
      .limit(1)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Dish not found"});
        }
        dishData = doc.data();
        return doc.ref.update({star: !doc.data().star});
      })
      .then(() => {
        dishData.star = !dishData.star;
        return res.json(dishData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

// Update a dish name
exports.updateDishName = (req, res) => {
  if (isEmpty(req.body.name)) {
    return res.status(404).json({error: "Name cannot be empty"});
  }

  let docData;

  db.collection("dishes")
      .where("dishId", "==", req.params.dishId)
      .where("resId", "==", req.params.resId)
      .limit(1)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Dish not found"});
        }
        docData = doc.data();
        return doc.ref.update({name: req.body.name});
      })
      .then(() => {
        docData.name = req.body.name;
        res.json(docData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

// Delete a dish
exports.deleteDish = (req, res) => {
  // Verify user then delete
  db.doc(`/users/${req.user.handle}`)
      .get()
      .then((user) => {
        if (!user.exists) {
          return res.status(404).json({error: "User not found"});
        }
        user.ref.update({dishCount: user.data().dishCount - 1});
        return db.collection("dishes")
            .where("dishId", "==", req.params.dishId)
            .where("resId", "==", req.params.resId)
            .limit(1)
            .get();
      })
      .then((dish) => {
        if (!dish.exists) {
          return res.status(404).json({error: "Dish not found"});
        }
        return dish.delete();
      })
      .then(() => {
        res.json({message: "Dish deleted successfully"});
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};
