// backend/config/firebase.js
// Firebase Admin SDK Configuration for Backend

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://sportweb-3605c-default-rtdb.europe-west1.firebasedatabase.app",
});

// Get references to Firebase services
const db = admin.database();
const auth = admin.auth();

module.exports = {
  admin,
  db,
  auth,
};
