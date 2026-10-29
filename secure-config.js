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
const defaultEnvVarExports = [];
const defaultEnvVarProperty = '__envVarExports';
const defaultEnvVarDenyList = [];

// Env vars that must never be set from a __envVarExports list embedded in the configuration file.
// Entries ending with '*' are prefix matches. Matching is case-insensitive (env var names are on Windows).
const builtInEnvVarDenyList = [
    'NODE_OPTIONS', 'NODE_PATH', 'NODE_ENV', 'NODE_EXTRA_CA_CERTS', 'NODE_TLS_REJECT_UNAUTHORIZED',
    'NPM_CONFIG_*', 'LD_*', 'DYLD_*', 'PATH', 'BASH_ENV', 'ENV', 'IFS', 'SHELL',
    'PYTHONPATH', 'PYTHONSTARTUP', 'PERL5OPT', 'RUBYOPT'
];

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

function isEnvVarDenied(envVar, denyList) {
    const name = envVar.toUpperCase();
    return denyList.some(entry => {
        if (typeof entry !== 'string' || entry.length === 0) {
            return false;
        }
        const pattern = entry.toUpperCase();
        return pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : name === pattern;
    });
}

function validateConfigEnvVarExports(exports, denyList) {
    exports.forEach(item => {
        if (item && typeof item.envVar === 'string' && isEnvVarDenied(item.envVar, denyList)) {
            throw new Error(`Exporting to environment variable ${item.envVar} via ${defaultEnvVarProperty} in the configuration is not allowed.`);
        }
    });
}

function exportEnvVars(conf, exports) {
    const callbacks = {
        processValue: (key, value, level, path) => {
            let searchKey = '';
            if(path && path.length > 0) {
                searchKey = path.join('.') + '.';
            }
            searchKey += key;
            const exportItem = exports.find(item => item.key === searchKey);
            if (exportItem && typeof exportItem.envVar === 'string' && exportItem.envVar.length > 0) {
                process.env[exportItem.envVar] = value;
            }
        }
    };
    jt.traverse(conf, callbacks);
}

function getConfigPath(options) {
    const prefix = getOptValue(options, 'prefix', defaultFilePrefix);
    const directory = getOptValue(options, 'directory', path.join(process.cwd(), defaultDirectory));
    const confFileName = prefix + (process.env.NODE_ENV ? '-' + process.env.NODE_ENV : '') + '.json';
    const confPath = path.join(directory, confFileName);
    if (!fs.existsSync(confPath)) {
        throw new Error(`Configuration file for NODE_ENV ${process.env.NODE_ENV} and prefix ${prefix} does not exist.`);
    }
    return confPath;
}

function loadConfigFile(confPath) {
    // read fresh on every call: require() would cache the object and decryption mutates it in place
    const content = fs.readFileSync(confPath, 'utf8');
    try {
        return JSON.parse(content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content);
    }
    catch (err) {
        err.message = `${confPath}: ${err.message}`;
        throw err;
    }
}

module.exports = (options) => {
    // load the configuration JSON
    let conf = loadConfigFile(getConfigPath(options));
    // get the key and decrypt
    const keyVariableName = getOptValue(options, 'keyVariable', defaultKeyVariableName);
    const key = getKey(keyVariableName);
    decryptConfig(conf, key);
    // validate HMAC 
    if (getOptValue(options, 'hmacValidation', defaultHmacValidation)) {
        if (!oh.verifyHmac(conf, key, getOptValue(options, 'hmacProperty', defaultHmacProperty))) {
            throw new Error('HMAC validation failed.');
        }
    }
    // export env vars as passed via options or in the configuration itself (options have precedence)
    let exports = getOptValue(options, 'envVarExports', defaultEnvVarExports);
    if(!Array.isArray(exports) || exports.length == 0) {
        exports = conf[defaultEnvVarProperty];
        // exports defined in the configuration file are untrusted unless HMAC-validated, so apply the deny-list
        if (Array.isArray(exports)) {
            const extraDenied = getOptValue(options, 'envVarDenyList', defaultEnvVarDenyList);
            validateConfigEnvVarExports(exports, [
                ...builtInEnvVarDenyList,
                keyVariableName,
                ...(Array.isArray(extraDenied) ? extraDenied : [])
            ]);
        }
    }
    if (Array.isArray(exports) && exports.length > 0) {
        exportEnvVars(conf, exports);
    }
    return conf;
};
