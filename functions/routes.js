const express = require('express');
const handlers = require('./handlers');
const router = express.Router();
const multer = require('multer');
const upload = multer();

router.route('/')
    .get((req, res) => {res.send({msg: "This is beginning of the route"})});

router.route('/login')
    .get(handlers.getLogin) // FOR FRONT-END
    .post(upload.none(), handlers.postLogin);

router.route('/register')
    .get(handlers.getRegister) // FOR FRONT-END
    .post(upload.none(), handlers.postRegister);

router.route('/auth')
    .get(handlers.goAuth);

router.route('/shorts') // CAN BE MODIFIED TO /links
    .get(handlers.getShorts) // plural and singular;
    .post(upload.none(), handlers.postShort)
    .put(upload.none(), handlers.putShort)
    .delete(handlers.delShort); // plural and singular;

router.get('/:mask', handlers.goRedirect);

module.exports = router;