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
const serialKeyRef = db.ref('serial_key');
module.exports = { db, admin, usersRef, shortsRef, serialKeyRef };