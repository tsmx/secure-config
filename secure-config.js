const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const algorithm = 'aes-256-cbc';

function getKey() {
    if (!process.env.CONFIG_ENCRYPTION_KEY) {
        throw new Error('Environment variable CONFIG_ENCRYPTION_KEY not set.');
    }
    else if (process.env.CONFIG_ENCRYPTION_KEY.toString().length !== 32) {
        throw new Error('CONFIG_ENCRYPTION_KEY length must be 32 bytes.');
    }
    return Buffer.from(process.env.CONFIG_ENCRYPTION_KEY);
}

function decryptValue(text, key) {
    let input = text.split('|');
    input.shift();
    let iv = Buffer.from(input[0], 'hex');
    let encryptedText = Buffer.from(input[1], 'hex');
    let decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function decryptConfig(conf, key) {
    for (var prop in conf) {
        if (!Object.prototype.hasOwnProperty.call(conf, prop)) continue;
        if (Array.isArray(conf[prop])) {
            continue;
        }
        if (typeof conf[prop] == 'object') {
            decryptConfig(conf[prop], key);
        } else if (conf[prop] !== null) {
            if (conf[prop].toString().startsWith('ENCRYPTED|')) {
                conf[prop] = decryptValue(conf[prop].toString(), key);
            }
        }
    }
    return conf;
}

function getConfigPath() {
    let confPath = null;
    if (process.env.NODE_ENV) {
        confPath = path.join(process.cwd(), 'conf', 'config-' + process.env.NODE_ENV + '.json');
    }
    else {
        confPath = path.join(process.cwd(), 'conf', 'config.json');
    }
    if (!fs.existsSync(confPath)) {
        throw new Error('Configuration file for NODE_ENV ' + process.env.NODE_ENV + ' does not exist.');
    }
    return confPath;
}

var conf = require(getConfigPath());
const key = getKey();
decryptConfig(conf, key);

module.exports = conf;