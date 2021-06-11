const path = require('path');
const fs = require('fs');
const sc = require('@tsmx/string-crypto');
const jt = require('@tsmx/json-traverse');

const prefix = 'ENCRYPTED|';
const defaultKeyVariableName = 'CONFIG_ENCRYPTION_KEY';

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

module.exports = (_options) => {
    let conf = require(getConfigPath());
    let confKey = getKey(defaultKeyVariableName);
    decryptConfig(conf, confKey);
    return conf;
};