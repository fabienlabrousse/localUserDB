const {PASSWORD_SALT} = require('./const');
const crypto = require('crypto');

exports.passwordHasher = (password) => {
    let hash = crypto.createHmac('sha512', PASSWORD_SALT);
    hash.update(password);
    return hash.digest('hex');
};
