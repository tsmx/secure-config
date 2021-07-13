# [**@tsmx/secure-config**](https://github.com/tsmx/secure-config)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![npm (scoped)](https://img.shields.io/npm/v/@tsmx/secure-config)
![node-current (scoped)](https://img.shields.io/node/v/@tsmx/secure-config)
[![Build Status](https://img.shields.io/github/workflow/status/tsmx/secure-config/git-ci-build)](https://img.shields.io/github/workflow/status/tsmx/secure-config/git-ci-build)
[![Coverage Status](https://coveralls.io/repos/github/tsmx/secure-config/badge.svg?branch=master)](https://coveralls.io/github/tsmx/secure-config?branch=master)

> Secure multi-environment configuration management with encrypted secrets. Optional tamper resistance by HMAC validation.

If you are upgrading from an older version prior to 2.x please read this [important note](#upgrading-from-versions-prior-to-2x)

## Usage

1. Encrypt sensitive data in your JSON configuration file. Most easy way to do this is using the [secure-config-tool](https://www.npmjs.com/package/@tsmx/secure-config-tool).
For more details please see [generating encrypted values](#generating-encrypted-entries) and [naming conventions](#naming-conventions).
    ```json
    {
      "database": {
        "host": "127.0.0.1",
        "user": "ENCRYPTED|50ceed2f97223100fbdf842ecbd4541f|df9ed9002bfc956eb14b1d2f8d960a11",
        "pass": "ENCRYPTED|8fbf6ded36bcb15bd4734b3dc78f2890|7463b2ea8ed2c8d71272ac2e41761a35"
      }
    }
    ```

2. Use your configuration in the code.
    ```js
    const conf = require('@tsmx/secure-config')();

    function MyFunc() {
      let dbHost = conf.database.host; // = '127.0.0.1'
      let dbUser = conf.database.user; // = 'MySecretDbUser'
      let dbPass = conf.database.pass; // = 'MySecretDbPass'
      //...
    }
    ```
    For further customization and advanced features like HMAC validation you can pass an options object - please refer to the [options section](#options).

3. Run your app. See below for different [options on how to pass the key](#injecting-the-decryption-key).
   ```bash
   $ export CONFIG_ENCRYPTION_KEY=...
   $ node app.js
   ```

A fully working [example project](https://github.com/tsmx/secure-config-test) is also available on GitHub. 

To get all information please also check out the [full documentation](https://tsmx.net/secure-config/).

## Naming conventions

You can have multiple configuration files for different environments or stages. They are distinguished by the environment variable `NODE_ENV`. The basic configuration file name is `config.json` if this variable is not present. If it is present, a configuration file with the name `config-[NODE_ENV].json`
is used. An exception will be thrown if no configuration file is found.

All configuration files must be located in a `conf/` directory of the current running app, meaning a direct subdirectory of the current working directory (`CWD/conf/`).  

### Example structure

| Stage       | Value of NODE_ENV | Filename                    | 
|-------------|-------------------|-----------------------------|
| Development | not set           | conf/config.json            | 
| Production  | `production`      | conf/config-production.json | 
| Test        | `test`            | conf/config-test.json       |

Resulting folders/files setup:
```
path-to-your-app/
├── conf/
│   ├── config.json
│   ├── config-production.json
│   └── config-test.json
├── app.js
└── package.json
```

## Options

To retrieve a configuration using all default values and without advanced features, you simply invoke a function after the require statement without any argument (set of parenthesis after `require`).

```js
const conf = require('@tsmx/secure-config')();
```

To make use of the more advanced features and customize default values, you can pass an options object to this function call.

```js
const confOptions = {
    keyVariable: 'CUSTOM_CONFIG_KEY',
    hmacValidation: true, 
    hmacProperty: '_signature'
}

const conf = require('@tsmx/secure-config')(confOptions);
```

The following options are available.

### keyVariable

Type: `String`
Default: `CONFIG_ENCRYPTION_KEY`

The name of the environment variable containing the key for decrypting configuration values and validating the HMAC. See also [options on how to pass the key](#injecting-the-decryption-key).

### hmacValidation

Type: `Boolean`
Default: `false`

Specifies if the loaded configuration should be validated against a given HMAC. If set to true, secure-config will validate the HMAC of the decrypted configuration content against a given HMAC using the current key. If the validation fails, an exception will be thrown. If it succeeds, the decrypted configuration will be returned.

The given HMAC is retrieved from a configuration files property with the name of [hmacProperty](#hmacProperty).

Enabling this option adds more security to your configuration management as the loaded configuration is safe against tampering. If an attacker would modify unencrypted entries in your configuration, this would cause the HMAC validation to fail and prevent you from any harm.

Please ensure that your stored configuration files have an appropriate HMAC property before enabling this option. Otherwise loading the configuration would always fail.

### hmacProperty

Type: `String`
Default: `__hmac`

The name of the HMAC property in a configuration file to be validated against. Only used when [hmacValidation](#hmacValidation) is set tor `true`.

Example configuration file using a custom HMAC property name:
```js
{
    "database": {
        "host": "db.prod.com",
        "user": "ENCRYPTED|5cf569c8229d05034f173119795158fd|1d71ad3d86e402d2ebb8b2a1ef796862",
        "password": "ENCRYPTED|9a4e5fdbbfe10b1d2b81a9ec9d46c6d1|95bf57f6ef988b80fa75577ed2da04c3b4549ac2de03c45fbbb8b4033b58b415"
    },
    "_signature": "3023eb8cf76894c0d5c7f893819916d876f98f781f8944b77e87257ef77c1adf"
}
```

Loading the configuration with HMAC validation enabled:
```js
const confOptions = {
    hmacValidation: true, 
    hmacProperty: '_signature'
}
const conf = require('@tsmx/secure-config')(confOptions);
```

## Injecting the decryption key

The key for decrypting the encrypted values is derived from an environment variable. The default name of this variable is `CONFIG_ENCRYPTION_KEY`, but you can also pass any other name via [options](#options). You can set the environment variable whatever way is most suitable, e.g.

- set/export in the command line or in your bash pofile
  ```
  export CONFIG_ENCRYPTION_KEY=0123456789qwertzuiopasdfghjklyxc
  ```
- using an env block in your VS-Code launch configuration
  ```json
  ...
  "env": {
      "CONFIG_ENCRYPTION_KEY": "0123456789qwertzuiopasdfghjklyxc"
  },
  ...
  ```
- using an env block in your deployment descriptor, e.g. app.yaml for Google App Engine
  ```yaml
  env_variables:
    CONFIG_ENCRYPTION_KEY: "0123456789qwertzuiopasdfghjklyxc"
  ```
- for testing with [Jest](https://jestjs.io/) I recommend to create a test key and set it globally for all tests in the `jest.config.js`, e.g.
  ```javascript
  process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';

  module.exports = {
      testEnvironment: 'node'
  };
  ```
- etc.

More examples are available in the [full documentation](https://tsmx.net/secure-config/).

The key length must be 32 bytes! The value set in `CONFIG_ENCRYPTION_KEY` has to be:
- a string of 32 characters length, or
- a hexadecimal value of 64 characters length (= 32 bytes)

Otherwise an error will be thrown.

Examples of valid key strings:
- 32 byte string: `MySecretConfigurationKey-123$%&/`
- 32 byte hex value: `9af7d400be4705147dc724db25bfd2513aa11d6013d7bf7bdb2bfe050593bd0f`

Different keys for each configuration environment are strongly recommended.

## Generating encrypted entries

### Option 1: secure-config-tool

For better convenience I provided a very basic [secure-config-tool](https://www.npmjs.com/package/@tsmx/secure-config-tool) to easily generate the encrypted entries.

### Option 2: NodeJS crypto functions 

You can simply use `crypto` functions from NodeJS with the following snippet to create the encrypted entries:

```js
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

function encrypt(value) {
  let iv = crypto.randomBytes(16);
  let key = Buffer.from('YOUR_KEY_HERE');
  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return 'ENCRYPTED|' + iv.toString('hex') + '|' + encrypted.toString('hex');
}
```

### Remarks

The generated encrypted entry must always have the form: `ENCRYPTED | IV | DATA`. 

| Part        | Description |
|-------------|-------------|
| `ENCRYPTED` | The prefix `ENCRYPTED` used to identify configuration values that must be decrypted. |
| `IV`        | The ciphers initialization vector (IV) that was used for encryption. Hexadecimal value. |
| `DATA`      | The AES-256-CBC encrypted value. Hexadecimal value. |

## Upgrading from versions prior to 2.x

In versions before 2.x, the secure-config module directly exported the configuration object when requiring in the module. To add more flexibility and being able to provide new features, this was changed in the 2.x versions. The module now exports a function which can receive additional [options](#options). 

Since there's a full backward compatibility, all you have to do in your code using version 1.x so far is to invoke the function by adding a set of parenthesis.

```js
// version 1.x: requiring in without any function call
const conf = require('@tsmx/secure-config');

// version 2.x change to that for retaining full backward compatibility
const conf = require('@tsmx/secure-config')();

// use conf as you did before...
```

## Test

```
npm install
npm test
```