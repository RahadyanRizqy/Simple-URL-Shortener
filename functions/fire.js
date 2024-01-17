const admin = require('firebase-admin');
const serviceAccount = require('../key/sh-rdnet-id-firebase-adminsdk-pdq6d-656d8a63fc.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sh-rdnet-id-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const db = admin.database();
const usersRef = db.ref('users');
const shortsRef = db.ref('shorts');
module.exports = { db, admin, usersRef, shortsRef };