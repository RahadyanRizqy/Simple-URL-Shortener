const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require(process.env.SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_URL
});
const db = admin.database();
const usersRef = db.ref('users');
const shortsRef = db.ref('shorts');
module.exports = { db, admin, usersRef, shortsRef };