const path = require('path');
const fs = require('fs');
const sc = require('@tsmx/string-crypto');
const jt = require('@tsmx/json-traverse');
const oh = require('@tsmx/object-hmac');

const prefix = 'ENCRYPTED|';
const defaultDirectory = 'conf';
const defaultFilePrefix = 'config';
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
    jt.traverse(conf, callbacks);
    return conf;
}

function getConfigPath(options) {
    const prefix = getOptValue(options, 'prefix', defaultFilePrefix);
    // Allow to store the config in shared package in monorepo AND/OR use import.meta or __dirname to select the path
    const dirname = getOptValue(options, 'directory', path.join(process.cwd(), defaultDirectory));
    const confFileName = prefix + (process.env.NODE_ENV ? '-' + process.env.NODE_ENV : '') + '.json';
    const confPath = path.join(directory, confFileName);
    if (!fs.existsSync(confPath)) {
        throw new Error(`Configuration file for NODE_ENV ${process.env.NODE_ENV} and prefix ${prefix} does not exist.`);
    }
    return confPath;
}

module.exports = (options) => {
    let conf = require(getConfigPath(options));
    const key = getKey(getOptValue(options, 'keyVariable', defaultKeyVariableName));
    decryptConfig(conf, key);
    if (getOptValue(options, 'hmacValidation', defaultHmacValidation)) {
        if (!oh.verifyHmac(conf, key, getOptValue(options, 'hmacProperty', defaultHmacProperty))) {
            throw new Error('HMAC validation failed.');
        }
    }
    return conf;
};
