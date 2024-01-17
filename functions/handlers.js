const { db, usersRef, shortsRef } = require('./fire');
const { fireAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('./auth');
const { generateUniqueRandomString, generateJwtToken, decodeJwtToken } = require('./func');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const getLogin = (req, res) => {
    return res.status(200).json({
        method: req.method,
        msg: "This is /login route"
    });
}

const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userCredential = await signInWithEmailAndPassword(fireAuth, email, password);
        const token = generateJwtToken(userCredential.user.uid, process.env.SECRET_KEY, jwt, process.env.JWT_EXP);

        return res.status(200).json({
            method: req.method,
            msg: "This is /login route",
            loginDetail: {
                userId: userCredential.user.uid,
                email: email,
                token: token
            }
        });
    }
    catch (error) {
        return res.status(400).json({
            method: req.method,
            msg: "This is /login route",
            error: error.message
        });
    }
}

const getRegister = async (req, res) => {
    return res.status(200).json({
        method: req.method,
        msg: "This is /register route"
    });
}

const postRegister = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userCredential = await createUserWithEmailAndPassword(fireAuth, email, password);
        usersRef.child(userCredential.user.uid).set({
            email: email,
            id: userCredential.user.uid
        });

        return res.status(200).json({
            method: req.method,
            msg: "This is /register route",
            registerDetail: {
                uid: userCredential.user.uid,
                email: userCredential.user.email
            }
        });
    }
    catch (error) {
        return res.status(400).json({
            method: req.method,
            msg: "This is /register route",
            error: error.message
        });
    }
}



const goAuth = async (req, res) => {
    try {
        const userId = decodeJwtToken(req, process.env.SECRET_KEY, jwt);
        return res.status(200).json({
            method: req.method,
            msg: "This is /login route",
            authDetail: {
                userId: userId,
            }
        });
    } catch (error) {
        return res.status(400).json({msg: error.message});
    }
}

const getShorts = async (req, res) => {
    try {
        const { id } = req.query;
        const userId = decodeJwtToken(req, process.env.SECRET_KEY, jwt);

        usersRef.child(userId).child('shorts').once('value', async (snapshot) => {
            const allShorts = snapshot.val();
            const shortsPromises = [];

            if (allShorts) {
                allShorts.forEach(element => {
                    const shortsPromise = db.ref('shorts').child(element).once('value').then(shortSnapshot => shortSnapshot.val());
                    shortsPromises.push(shortsPromise);
                });
                
                const shorts = await Promise.all(shortsPromises);
                if (id) {
                    const specificShort = shorts.find(short => short && short.id === id);
                    if (specificShort) {
                        return res.status(200).json({
                            msg: 'Get specific short',
                            id: id,
                            short: specificShort
                        });
                    } else {
                        return res.status(404).json({
                            error: 'Short not found'
                        });
                    }
                } else {
                    return res.status(200).json({
                        msg: "Get all shorts",
                        userId: userId,
                        shorts: shorts
                    });
                }
            } else {
                return res.status(200).json({
                    msg: "No shorts found for the user",
                    userId: userId,
                });
            }
        });
    } catch (error) {
        return res.status(400).json({msg: error.message});
    }
};

const postShort = async (req, res) => {
    try {
        const userId = decodeJwtToken(req, process.env.SECRET_KEY, jwt);
        
        let { mask, desc, url } = req.body;
        
        const userShortsRef = await usersRef.child(userId).child('shorts').once('value');
        const existingMasks = Object.values(userShortsRef.val() || {});
        const _mask = mask && mask.trim() !== '' ? mask : await generateUniqueRandomString(5, existingMasks);

        const maskExistsSnapshot = await shortsRef.child(_mask).once('value');
        if (maskExistsSnapshot.exists()) {
            return res.status(400).json({ msg: "Shorten already exists" });
        }
        else {
            usersRef.child(userId).child('shorts').child(userShortsRef.val() === null ? 0 : userShortsRef.val().length).set(_mask);
            const shortDetail = {
                'desc': desc ?? null,
                'url': url,
                'mask': _mask
            }
            shortsRef.child(_mask).set(shortDetail);
            return res.status(201).json({
                msg: "Short added",
                shortDetail: shortDetail
            });
        }
    
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
}

const putShort = async (req, res) => {
    return res.status(200).json({route: "PUT /shorts editing short"});
}

const delShort = async (req, res) => {
    const { id } = req.query;
    if (id) {
        return res.status(200).json({
            msg: 'Del specific short',
            id: id
        });
    }
    else {
        return res.status(200).json({msg: "Del all shorts"})
    }
}
    
    
const goRedirect = async (req, res) => {
    const { mask } = req.params;
    try {
        const snapshot = await shortsRef.orderByChild('mask').equalTo(mask).once('value');
        const url = snapshot.val();
        if (url) {
            return res.redirect(302, url[Object.keys(url)[0]].url);
        } else {
            return res.status(404).json({ error: 'URL not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { 
    getLogin, postLogin, 
    getRegister, postRegister,
    getShorts, postShort, putShort, delShort,
    goRedirect,
    goAuth,
};