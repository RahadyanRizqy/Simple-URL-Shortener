const { db, admin, usersRef, shortsRef } = require('./fire');
const { fireAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('./auth');
const { generateUniqueRandomString, generateJwtToken, decodeJwtToken, validateAuth, validateMask } = require('./callbacks');
const { forbiddenMasks, forbiddenChars } = require('./statics');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const homeApi = async (req, res) => {
    res.send({
        msg: "This is beginning of the Simple URL Shortener backend route",
        git: "https://github.com/RahadyanRizqy/Simple-URL-Shortener.git"
    })
}

const getRegister = async (req, res) => {
    res.send({
        method: req.method,
        route: req.path
    });
}

const postRegister = async (req, res) => {
    try {
        const { email, password } = req.body;
        validateAuth(req);
       
        const adminAuth = admin.auth();
        const usersFromAuth = (await adminAuth.listUsers()).users.map(user => user.email);
        const usersFromDb = (await usersRef.orderByChild('email').once('value')).val() === null ? [] : Object.values((await usersRef.orderByChild('email').once('value')).val()).map(user => user.email);
        
        if (usersFromAuth.includes(email) && usersFromDb.includes(email)) {
            throw new Error("user-already-exists-please-login");
        }
        else if (usersFromAuth.includes(email) && (!usersFromDb.includes(email))) {
            throw new Error("user-exists-auth-only-contact-admin");
        }
        else if (!(usersFromAuth.includes(email)) && usersFromDb.includes(email)) {
            throw new Error("user-exists-db-only-contact-admin");
        }
        else {
            createUserWithEmailAndPassword(fireAuth, email, password)
            .then((userCredential) => {
                const registerDetail = {
                    email: email,
                    id: userCredential.user.uid
                }
                usersRef.child(userCredential.user.uid).set(registerDetail);
                return res.status(201).json({
                    method: req.method,
                    msg: "register-success",
                    registerDetail: registerDetail,
                    route: req.path
                });
            })
            .catch((error) => {
                return res.status(400).json({
                    method: req.method,
                    msg: error.message,
                    route: req.path
                });
            });
        }
    }
    catch (error) {
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path,
        });
    }
}

const getLogin = (req, res) => {
    res.send({
        method: req.method,
        route: req.path
    });
}

const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        validateAuth(req);

        const adminAuth = admin.auth();
        const usersFromAuth = (await adminAuth.listUsers()).users.map(user => user.email);
        const usersFromDb = Object.values((await usersRef.orderByChild('email').once('value')).val()).map(user => user.email);

        if (!(usersFromAuth.includes(email)) && (!usersFromDb.includes(email))) {
            throw new Error("user-does-not-exist-please-register");
        }
        else if (usersFromAuth.includes(email) && (!usersFromDb.includes(email))) {
            throw new Error("user-exists-auth-only-contact-admin");
        }
        else if (!(usersFromAuth.includes(email)) && usersFromDb.includes(email)) {
            throw new Error("user-exists-db-only-contact-admin");
        }
        else {
            signInWithEmailAndPassword(fireAuth, email, password)
            .then((userCredential) => {
                const token = generateJwtToken(userCredential.user.uid, process.env.SECRET_KEY, jwt, process.env.JWT_EXP);
                const loginDetail = {
                    email: email,
                    id: userCredential.user.uid,
                    token: token
                }
                return res.status(200).json({
                    method: req.method,
                    msg: "login-success",
                    loginDetail: loginDetail,
                    route: req.path
                });
            })  
            .catch((error) => {
                return res.status(400).json({
                    method: req.method,
                    msg: error.message,
                    route: req.path
                });
            }); 
        }
    }
    catch (error) {
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path
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

const getForbiddens = async (req, res) => {
    try {
        res.send({
            msg: "This is forbidden short and not purposed for the shortener",
            masks: forbiddenMasks,
            chars: forbiddenChars
        })
    }
    catch (error) {
        return res.status(400).json({msg: error.message});
    }
}

const getShorts = async (req, res) => {
    try {
        const { mask } = req.query;
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
                if (mask) {
                    const specificShort = shorts.find(short => short && short.mask === mask);
                    if (specificShort) {
                        return res.status(200).json({
                            msg: 'Get specific short',
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
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path
        });
    }
};

const postShort = async (req, res) => {
    try {
        const userId = decodeJwtToken(req, process.env.SECRET_KEY, jwt);
        
        let { mask, desc, url } = req.body;
        validateMask(mask, forbiddenChars);

        const userShortsRef = await usersRef.child(userId).child('shorts').once('value');
        const existingMasks = Object.values(userShortsRef.val() || {});
        const _mask = mask && mask.trim() !== '' ? mask : await generateUniqueRandomString(5, existingMasks);

        const maskExistsSnapshot = await shortsRef.child(_mask).once('value');
        if (maskExistsSnapshot.exists()) {
            return res.status(400).json({ msg: "Shorten already exists" });
        }
        else if (forbiddenMasks.includes(_mask)) {
            return res.status(400).json({
                msg: "Shorten are forbidden",
                forbiddenMasks: forbiddenMasks
            });
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
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path
        });
    }
}

const putShort = async (req, res) => {
    try {
        const { mask } = req.query;
        
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
                const specificShort = shorts.find(short => short && short.mask === mask);
                if (specificShort) {
                    const { newMask, newDesc, newUrl } = req.body;
                    validateMask(newMask, forbiddenChars);
                    const newAllShorts = allShorts.filter(item => item !== mask);

                    if (newAllShorts.includes(newMask)) {
                        return res.status(400).json({ msg: "New shorten mask already exists" });
                    }
                    else {
                        const userShortsRef = await usersRef.child(userId).child('shorts').once('value');
                        const existingMasks = Object.values(userShortsRef.val() || {});
                        const _newMask = newMask && newMask.trim() !== '' ? newMask : await generateUniqueRandomString(5, existingMasks);
                    
                        usersRef.child(userId).child('shorts').child(allShorts.findIndex(item => item == mask)).set(_newMask);
                        const shortDetail = {
                            'desc': newDesc ?? null,
                            'url': newUrl,
                            'mask': _newMask
                        }
                        shortsRef.child(_newMask).set(shortDetail);
                        shortsRef.child(mask).remove()
                        return res.status(201).json({
                            msg: "Short updated",
                            shortDetail: shortDetail
                        });
                    }
                } else {
                    return res.status(404).json({
                        error: 'Short is not found'
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
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path
        });
    }
}

const delShort = async (req, res) => {
    try {
        const { mask } = req.query;
        const userId = decodeJwtToken(req, process.env.SECRET_KEY, jwt);

        usersRef.child(userId).child('shorts').once('value', async (snapshot) => {
            const allShorts = snapshot.val();
            if (allShorts.includes(mask)) {
                usersRef.child(userId).child('shorts').child(allShorts.findIndex(item => item == mask)).remove();
                shortsRef.child(mask).remove();
                return res.status(200).json({
                    msg: "Short is deleted"
                });
            }
            else {
                return res.status(200).json({
                    msg: "Short is not found"
                });
            }
        });

    }
    catch (error) {
        return res.status(400).json({
            msg: error.message
        });
    }
}
    
    
const goRedirect = async (req, res) => {
    const { mask } = req.params;
    try {
        shortsRef.orderByChild('mask').equalTo(mask).once('value', (snapshot) => {
            const url = snapshot.val();
            if (url) {
                return res.redirect(302, url[Object.keys(url)[0]].url);
            } else {
                return res.status(404).json({ error: 'URL not found'});
            }
        });
    }
    catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    homeApi, 
    getRegister, postRegister,
    getLogin, postLogin, 
    getShorts, postShort, putShort, delShort,
    goRedirect,
    goAuth,
    getForbiddens
};