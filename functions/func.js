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

module.exports = { generateUniqueRandomString, generateJwtToken, decodeJwtToken };