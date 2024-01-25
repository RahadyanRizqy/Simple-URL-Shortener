async function generateUniqueRandomString(length=5, existingMasks) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let randomString = '';
    do {
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
      }
    } while (existingMasks.includes(randomString));
    return randomString;
}

function generateJwtToken(userId, secretKey, jwt, expiresIn='1h') {
    const payload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
    };
    return jwt.sign(payload, secretKey, { expiresIn });
}

function decodeJwtToken(req, secretKey, jwt) {
    const token = req.header('Authorization').replace('Bearer', '').trim();
    const decodedToken = jwt.verify(token, secretKey);
    const userId = decodedToken.sub;
    return userId;
}

function validateAuth(req) {
    if ((!req.body.email && !req.body.password) || (/^\s*$/.test(req.body.email) && (/^\s*$/.test(req.body.password)))) {
        throw new Error("email-password-are-null-or-blankspaces");
    }
    else if (!req.body.email || (/^\s*$/.test(req.body.email))) {
        throw new Error("email-is-null-or-blankspaces");
    }
    else if (!req.body.password || (/^\s*$/.test(req.body.password))) {
        throw new Error("password-is-null-or-blankspaces");
    }
}

function validateMask(mask, chars) {
    const containForbiddenChars = chars.some(char => mask.includes(char));
    if (containForbiddenChars) {
        throw new Error("text-contains-forbidden-chars");
    }
}

function validateCreateShort(req) {
    if ((!req.body.mask && !req.body.url) || (/^\s*$/.test(req.body.mask) && (/^\s*$/.test(req.body.url)))) {
        throw new Error("mask-url-are-null-or-blankspaces");
    }
    else if (!req.body.mask || (/^\s*$/.test(req.body.mask))) {
        throw new Error("mask-is-null-or-blankspaces");
    }
    else if (!req.body.url || (/^\s*$/.test(req.body.url))) {
        throw new Error("url-is-null-or-blankspaces");
    }
}

module.exports = { generateUniqueRandomString, generateJwtToken, decodeJwtToken, validateAuth, validateMask, validateCreateShort };