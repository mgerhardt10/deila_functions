const {admin, db} = require("../utils/admin");
const config = require("../utils/config");
const {uuid} = require("uuidv4");

const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validators");

// User signup
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  const {valid, errors} = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

  const noImg = "no-img.png";

  let token; let userId;
  db.doc(`/users/${newUser.handle}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return res
              .status(400)
              .json({
                handle: "Handle already taken",
              });
        } else {
          return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
      })
      .then((data) => {
        userId = data.user.uid;
        return data.user.getIdToken();
      })
      .then((idToken) => {
        token = idToken;
        const userCredentials = {
          handle: newUser.handle,
          email: newUser.email,
          createdAt: new Date().toISOString(),
          // TODO Append token to imageUrl. Work around just add token from image in storage.
          imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
          bio: "",
          locCount: 0,
          resCount: 0,
          dishCount: 0,
          userId,
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
      })
      .then(() => {
        return res.status(201).json({token});
      })
      .catch((err) => {
        console.error(err);
        if (err.code === "auth/email-already-in-use") {
          return res.status(400).json({email: "Email already in use"});
        } else {
          return res
              .status(500)
              .json({
                general: "Something went wrong...please try again",
              });
        }
      });
};

// User login
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const {valid, errors} = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

  firebase
      .auth()
      .signInWithEmailAndPassword(user.email, user.password)
      .then((data) => {
        return data.user.getIdToken();
      })
      .then((token) => {
        return res.json({token});
      })
      .catch((err) => {
        console.error(err);
        return res
            .status(403)
            .json({
              general: "Wrong credentials, please try again",
            });
      });
};

// Get own user details
exports.getAuthenticatedUser = (req, res) => {
  const userData = {};
  db.doc(`/users/${req.user.handle}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          userData.credentials = doc.data();
          return db
              .collection("locations")
              .where("userHandle", "==", req.user.handle)
              .get();
        }
      })
      .then((locData) => {
        userData.locations = [];
        locData.forEach((locDoc) => {
          userData.locations.push({
            city: locDoc.data().city,
            state: locDoc.data().state,
            country: locDoc.data().country,
            createdAt: locDoc.data().createdAt,
            star: locDoc.data().star,
            locId: locDoc.id,
          });
        });
        return res.json(userData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
      });
};

// Upload a profile image for user
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({headers: req.headers});

  let imageToBeUploaded = {};
  let imageFileName;
  // String for image token
  const generatedToken = uuid();

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({error: "Wrong file type submitted"});
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
        Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = {filepath, mimetype};
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype,
              // Generate token to be appended to imageUrl
              firebaseStorageDownloadTokens: generatedToken,
            },
          },
        })
        .then(() => {
          // Append token to url
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
          return db.doc(`/users/${req.user.handle}`).update({imageUrl});
        })
        .then(() => {
          return res.json({message: "Image uploaded successfully"});
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({error: "Something went wrong"});
        });
  });
  busboy.end(req.rawBody);
};

