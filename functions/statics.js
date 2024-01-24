const forbiddenMasks = [
    '/'
    ,'about'
    ,'api'
    ,'auth'
    ,'contact'
    ,'forbidden-shorts'
    ,'git'
    ,'home'
    ,'info'
    ,'login'
    ,'rdnet'
    ,'register'
    ,'shorts'
];

const forbiddenChars = [
    '/',
    '?',
    '&',
];

module.exports = { 
    forbiddenMasks, 
    forbiddenChars
};