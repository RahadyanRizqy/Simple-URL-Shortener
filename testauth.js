const multer = require('multer');
const upload = multer();

const express = require('express');
const firebase = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Initialize Firebase
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

const auth = getAuth();
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies

// Sign-in route
app.post('/signin', upload.none(), async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // You can customize the response as needed
    res.json({ uid: user.uid, email: user.email });
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error('Sign-in failed:', error.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
