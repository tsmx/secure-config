const path = require('path');
const fs = require('fs');
const sc = require('@tsmx/string-crypto');
const jt = require('@tsmx/json-traverse');

function getKey() {
    const hexReg = new RegExp('^[0-9A-F]{64}$', 'i');
    let result = null;
    if (!process.env.CONFIG_ENCRYPTION_KEY) {
        throw new Error('Environment variable CONFIG_ENCRYPTION_KEY not set.');
    }
    else if (process.env.CONFIG_ENCRYPTION_KEY.toString().length == 32) {
        result = process.env.CONFIG_ENCRYPTION_KEY;
    }
    else if (hexReg.test(process.env.CONFIG_ENCRYPTION_KEY)) {
        result = process.env.CONFIG_ENCRYPTION_KEY;
    }
    else {
        throw new Error('CONFIG_ENCRYPTION_KEY length must be 32 bytes.');
    }
    return result;
}

function decryptConfig(conf, confKey) {
    const callbacks = {
        processValue: (key, value, level, path, isObjectRoot, isArrayElement, cbSetValue) => {
            if(!isArrayElement && value && value.toString().startsWith('ENCRYPTED|')) {
                cbSetValue(sc.decrypt(value.toString().substring(10), { key: confKey }));
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

let conf = require(getConfigPath());
let confKey = getKey();
decryptConfig(conf, confKey);

module.exports = conf;