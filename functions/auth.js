const firebase = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyABnn4dpWh26N7rcTVOk7A4GXlmVQPPTcQ",
  authDomain: "sh-rdnet-id.firebaseapp.com",
  databaseURL: "https://sh-rdnet-id-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sh-rdnet-id",
  storageBucket: "sh-rdnet-id.appspot.com",
  messagingSenderId: "475970791320",
  appId: "1:475970791320:web:fe8f1791ac84f4183aeded",
  measurementId: "G-VL07H76GQ7"
};

firebase.initializeApp(firebaseConfig);

const fireAuth = getAuth();

module.exports = { fireAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } ;