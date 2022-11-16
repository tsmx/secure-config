const path = require('path');
const fs = require('fs');
const sc = require('@tsmx/string-crypto');
const jt = require('@tsmx/json-traverse');
const oh = require('@tsmx/object-hmac');

const prefix = 'ENCRYPTED|';
const defaultKeyVariableName = 'CONFIG_ENCRYPTION_KEY';
const defaultHmacValidation = false;
const defaultHmacProperty = '__hmac';

function getOptValue(options, optName, defaultOptValue) {
    if (options && options[optName]) {
        return options[optName];
    }
    else {
        return defaultOptValue;
    }
}

function getKey(keyVariableName) {
    const hexReg = new RegExp('^[0-9A-F]{64}$', 'i');
    let result = null;
    if (!process.env[keyVariableName]) {
        throw new Error(`Environment variable ${keyVariableName} not set.`);
    }
    else if (process.env[keyVariableName].toString().length == 32) {
        result = process.env[keyVariableName];
    }
    else if (hexReg.test(process.env[keyVariableName])) {
        result = process.env[keyVariableName];
    }
    else {
        throw new Error(`${keyVariableName} length must be 32 bytes.`);
    }
    return result;
}

function decryptConfig(conf, confKey) {
    const callbacks = {
        processValue: (key, value, level, path, isObjectRoot, isArrayElement, cbSetValue) => {
            if (!isArrayElement && value && value.toString().startsWith(prefix)) {
                cbSetValue(sc.decrypt(value.toString().substring(prefix.length), { key: confKey }));
            }
        }
    };
    jt.traverse(conf, callbacks, true);
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

module.exports = (options) => {
    let conf = require(getConfigPath());
    const key = getKey(getOptValue(options, 'keyVariable', defaultKeyVariableName));
    decryptConfig(conf, key);
    if (getOptValue(options, 'hmacValidation', defaultHmacValidation)) {
        if (!oh.verifyHmac(conf, key, getOptValue(options, 'hmacProperty', defaultHmacProperty))) {
            throw new Error('HMAC validation failed.');
        }
    }
    return conf;
}