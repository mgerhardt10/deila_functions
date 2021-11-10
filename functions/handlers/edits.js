const {isEmpty} = require("../utils/validators");
const {db} = require("../utils/admin");
const {options} = require("../utils/assets");

// Update a star
exports.updateStar = (req, res) => {
  if (isEmpty(req.body.type)) {
    return res.status(400).json({error: "Type cannot be empty"});
  } else if (!options.includes(req.body.type)) {
    return res.status(400).json({error: "Type invalid"});
  }

  let data;
  db.doc(`/${req.body.type}/${req.params.id}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Document not found"});
        }
        data = doc.data();
        return doc.ref.update({star: !doc.data().star});
      })
      .then(() => {
        data.star = !data.star;
        return res.json(data);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

// Update a name
exports.updateName = (req, res) => {
  if (isEmpty(req.body.type)) {
    return res.status(400).json({error: "Type cannot be empty"});
  } else if (!options.includes(req.body.type)) {
    return res.status(400).json({error: "Type invalid"});
  }

  if (isEmpty(req.body.name)) {
    return res.status(400).json({error: "Name cannot be empty"});
  }

  let data;
  db.doc(`/${req.body.type}/${req.params.id}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Document not found"});
        }
        data = doc.data();
        if (req.body.type === "locations") {
          return doc.ref.update({city: req.body.name});
        } else {
          return doc.ref.update({name: req.body.name});
        }
      })
      .then(() => {
        if (req.body.type === "locations") {
          data.city = req.body.name;
        } else {
          data.name = req.body.name;
        }
        return res.json(data);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

// Update a body
exports.updateBody = (req, res) => {
  if (isEmpty(req.body.type)) {
    return res.status(400).json({error: "Type cannot be empty"});
  } else if (!options.includes(req.body.type) || req.body.type === "locations") {
    return res.status(400).json({error: "Type invalid"});
  }

  if (isEmpty(req.body.body)) {
    return res.status(400).json({error: "Body cannot be empty"});
  }

  let data;
  db.doc(`/${req.body.type}/${req.params.id}`)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          return res.status(404).json({error: "Document not found"});
        }
        data = doc.data();
        return doc.ref.update({body: req.body.body});
      })
      .then(() => {
        data.body = req.body.body;
        return res.json(data);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};
