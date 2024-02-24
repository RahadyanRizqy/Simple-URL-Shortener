const { 
    db, 
    admin, 
    usersRef, 
    shortsRef, 
    serialKeyRef 
} = require('./fire');

const { 
    fireAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} = require('./auth');

const { 
    generateUniqueRandomString,
    decodeAuth, 
    validateAuth, 
    validateForbidden, 
    validateShort,
    encodeAuth,
    loginMethod,
    registerMethod 
} = require('./midwares');

const { 
    forbiddenMasks, 
    forbiddenChars 
} = require('./statics');

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
            const result = await registerMethod(req, createUserWithEmailAndPassword, fireAuth, email, password, usersRef);
            return res.status(200).json(result);
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
            const result = await loginMethod(req, signInWithEmailAndPassword, fireAuth, email, password, process, jwt);
            return res.status(200).json(result);
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
        const userId = decodeAuth(req, process.env.SECRET_KEY, jwt);
        return res.status(200).json({
            authDetail: {
                userId: userId,
            },
            method: req.method,
            msg: "valid-token",
            route: req.path
        });
    } catch (error) {
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path
        });
    }
}

const getForbiddens = async (req, res) => {
    try {
        res.send({
            method: req.method,
            msg: "These are forbidden shorts/masks and not purposed for the shortener",
            forbidden: {
                masks: forbiddenMasks,
                chars: forbiddenChars
            },
            route: req.path
        })
    }
    catch (error) {
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path
        });
    }
}

const getShorts = async (req, res) => {
    try {
        const { mask } = req.query;
        const userId = decodeAuth(req, process.env.SECRET_KEY, jwt);

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
                            method: req.method,
                            msg: "get-specific-short",
                            route: req.path,
                            short: specificShort
                        });
                    } else {
                        return res.status(400).json({
                            method: req.method,
                            msg: "short-not-found",
                            route: req.path
                        });
                    }
                } else {
                    return res.status(200).json({
                        method: req.method,
                        msg: "get-all-shorts",
                        userId: userId,
                        route: req.path,
                        shorts: shorts
                    });
                }
            } else {
                return res.status(200).json({
                    method: req.method,
                    msg: "no-shorts-found-for-the-user",
                    userId: userId,
                    route: req.path
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
        const userId = decodeAuth(req, process.env.SECRET_KEY, jwt);
        
        let { mask, url, desc } = req.body;
        validateShort(req);
        validateForbidden(mask, forbiddenChars);

        const userShortsRef = await usersRef.child(userId).child('shorts').once('value');
        const existingMasks = Object.values(userShortsRef.val() || {});
        const _mask = mask ? mask : await generateUniqueRandomString(5, existingMasks);

        const maskExistsSnapshot = await shortsRef.child(_mask).once('value');
        if (maskExistsSnapshot.exists()) {
            return res.status(400).json({
                method: req.method,
                msg: "shorten-mask-already-exists",
                route: req.path
            });
        }
        else if (forbiddenMasks.includes(_mask)) {
            return res.status(400).json({
                method: req.method,
                msg: "shorten-are-forbidden",
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
                method: req.method,
                msg: "short-added",
                route: req.path,
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
        const userId = decodeAuth(req, process.env.SECRET_KEY, jwt);

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
                    const { newMask, newUrl, newDesc } = req.body;
                    validateShort(req);
                    validateForbidden(newMask, forbiddenChars);
                    const newAllShorts = allShorts.filter(item => item !== mask);

                    if (newAllShorts.includes(newMask)) {
                        return res.status(400).json({
                            method: req.method,
                            msg: "new-shorten-mask-already-exists",
                            route: req.path
                        });
                    }
                    else {
                        const userShortsRef = await usersRef.child(userId).child('shorts').once('value');
                        const existingMasks = Object.values(userShortsRef.val() || {});
                        const _newMask = newMask ? newMask : await generateUniqueRandomString(5, existingMasks);
                    
                        usersRef.child(userId).child('shorts').child(allShorts.findIndex(item => item == mask)).set(_newMask);
                        const shortDetail = {
                            'desc': newDesc ?? null,
                            'url': newUrl,
                            'mask': _newMask
                        }
                        shortsRef.child(_newMask).set(shortDetail);
                        shortsRef.child(mask).remove()
                        return res.status(201).json({
                            method: req.method,
                            msg: "short-is-edited",
                            route: req.path,
                            shortDetail: shortDetail
                        });
                    }
                } else {
                    return res.status(404).json({
                        method: req.method,
                        msg: "short-is-not-found",
                        route: req.path
                    });
                }
            } else {
                return res.status(200).json({
                    method: req.method,
                    msg: "no-shorts-found-for-the-user",
                    userId: userId,
                    route: req.path
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
        const userId = decodeAuth(req, process.env.SECRET_KEY, jwt);

        usersRef.child(userId).child('shorts').once('value', async (snapshot) => {
            const allShorts = snapshot.val();
            if (allShorts.includes(mask)) {
                usersRef.child(userId).child('shorts').child(allShorts.findIndex(item => item == mask)).remove();
                shortsRef.child(mask).remove();
                return res.status(200).json({
                    mask: mask,
                    method: req.method,
                    msg: "short-is-deleted",
                    route: req.path
                });
            }
            else {
                return res.status(200).json({
                    method: req.method,
                    msg: "no-shorts-found-for-the-user",
                    userId: userId,
                    route: req.path
                });
            }
        });
    }
    catch (error) {
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path
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
                return res.status(404).json({ error: 'Masked URL not found'});
            }
        });
    }
    catch (error) {
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path
        });
    }
}

const updateData = () => {
    const { customAlphabet } = require('nanoid');
    const password = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 20)();
    const formattedPassword = password.match(/.{1,5}/g).join('-');
    serialKeyRef.set(formattedPassword);
}

setInterval(updateData, process.env.SERIAL_KEY_RESET);

const reqToken = async (req, res) => {
    const { email, password, serialkey, exp } = req.query;
    try {
        if (!serialkey) { throw new Error('no-serialkey'); }

        const snapshot = await serialKeyRef.once('value');
        const serial_key_firebase = snapshot.val();

        if (serial_key_firebase !== serialkey) { throw new Error('invalid-serialkey'); }

        const result = await loginMethod(req, signInWithEmailAndPassword, fireAuth, email, password, process, jwt);

        if (result.msg === 'login-success') {
            const token = encodeAuth(result.loginDetail.id, process.env.SECRET_KEY, jwt, exp);
            return res.status(200).json({ 
                token: token,
                expiredIn: exp
            });
        }
    } catch (error) {
        return res.status(400).json({
            method: req.method,
            msg: error.message,
            route: req.path
        });
    }
};

module.exports = {
    homeApi, 
    getRegister, postRegister,
    getLogin, postLogin, 
    getShorts, postShort, putShort, delShort,
    goRedirect,
    goAuth,
    getForbiddens,
    reqToken
};

// GOTT ERHALTE, GOTT BESCHUTZE
// UNSERN GUTEN VATERLAND!