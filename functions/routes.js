const express = require('express');
const handlers = require('./handlers');
const router = express.Router();
const multer = require('multer');
const upload = multer();


router.route('/api')
    .get(handlers.homeApi);

router.route('/api/register')
    .get(handlers.getRegister) // FOR FRONT-END
    .post(upload.none(), handlers.postRegister);

router.route('/api/login')
    .get(handlers.getLogin) // FOR FRONT-END
    .post(upload.none(), handlers.postLogin);

router.route('/api/auth')
    .get(handlers.goAuth);

router.route('/api/shorts') // CAN BE MODIFIED TO /links
    .get(handlers.getShorts) // plural and singular;
    .post(upload.none(), handlers.postShort)
    .put(upload.none(), handlers.putShort)
    .delete(handlers.delShort); // plural and singular;

router.route('/api/forbiddens')
    .get(handlers.getForbiddens);

router.get('/:mask', handlers.goRedirect);

module.exports = router;