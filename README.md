# [**@tsmx/secure-config**](https://github.com/tsmx/secure-config)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![npm (scoped)](https://img.shields.io/npm/v/@tsmx/secure-config)
![node-current (scoped)](https://img.shields.io/node/v/@tsmx/secure-config)
[![Build Status](https://img.shields.io/github/actions/workflow/status/tsmx/secure-config/git-build.yml?branch=master)](https://img.shields.io/github/actions/workflow/status/tsmx/secure-config/git-build.yml?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/tsmx/secure-config/badge.svg?branch=master)](https://coveralls.io/github/tsmx/secure-config?branch=master)

> Easy and secure configuration management. 

Manage JSON based configurations with AES encrypted secrets for multiple environments/stages.

Optional features:
- [HMAC validation](#hmacValidation) of configurations to ensure data integrity
- Setting of environment variables out of configuration items 

Works with CommonJS and ESM/ECMAScript. Ships with a [SBOM](#SBOM) to meet regulatory requirements.

If you are upgrading from an older version prior to 2.x please read this [important note](#upgrading-from-versions-prior-to-2x).

## Usage

1. Encrypt sensitive data in your JSON configuration file. Easiest way to do this is using the [secure-config-tool](https://www.npmjs.com/package/@tsmx/secure-config-tool).
For more details please see [generating an encrypted configuration](#generating-an-encrypted-configuration) and [naming conventions](#naming-conventions).
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
    // CommonJS
    const conf = require('@tsmx/secure-config')();

    // ESM
    import secureConfig from '@tsmx/secure-config';
    const conf = secureConfig();

    function MyFunc() {
      let dbHost = conf.database.host; // = '127.0.0.1'
      let dbUser = conf.database.user; // = 'MySecretDbUser'
      let dbPass = conf.database.pass; // = 'MySecretDbPass'
      //...
    }
    ```
    For further customization and advanced features like HMAC validation and the setting of env vars you can pass an options object - please refer to the [options section](#options).

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

To change the default configuration file name or loading multiple configuration files you can pass the [prefix](#prefix) option.

By default, all configuration files are expected be located in a `conf/` directory of the current running app, meaning a direct subdirectory of the current working directory (`CWD/conf/`). To overwrite this behaviour, you can pass the [directory](#directory) option.

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

To retrieve a configuration using all default values and without advanced features, you simply invoke a function after the require/import statement without any argument (set of parenthesis after `require` or simple method call after `import`).

```js
// CommonJS
const conf = require('@tsmx/secure-config')();

// ESM
import secureConfig from '@tsmx/secure-config';
const conf = secureConfig();
```

To make use of the more advanced features and customize default values, you can pass an options object to this function call.

```js
const confOptions = {
  keyVariable: 'CUSTOM_CONFIG_KEY',
  hmacValidation: true, 
  hmacProperty: '_signature',
  directory: '/path/to/config',
  prefix: 'myconf',
  envVarExports: [
    { key: 'database.user', envVar: 'DB_USER' },
    { key: 'database.password', envVar: 'DB_PASSWORD' }
  ]
}

// CommonJS
const conf = require('@tsmx/secure-config')(confOptions);

// ESM
import secureConfig from '@tsmx/secure-config';
const conf = secureConfig(confOptions);
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

The given HMAC is retrieved from a configuration file property with the name of [hmacProperty](#hmacProperty), e.g.:

```json
{
  "database": {
    "host": "127.0.0.1",
    "user": "ENCRYPTED|50ceed2f97223100fbdf842ecbd4541f|df9ed9002bfc956eb14b1d2f8d960a11",
    "pass": "ENCRYPTED|8fbf6ded36bcb15bd4734b3dc78f2890|7463b2ea8ed2c8d71272ac2e41761a35"
  },
  "__hmac": "3023eb8cf76894c0d5c7f893819916d876f98f781f8944b77e87257ef77c1adf"
}
```

Enabling this option is recommended for production environments as it adds more security to your configuration management ensuring the loaded configuration is safe against tampering. Unwanted modifications of any - even unencrypted - entries in your configuration would cause the HMAC validation to fail and throw the error `HMAC validation failed`.

Please ensure that your stored configuration files have an appropriate HMAC property before enabling this option. Otherwise loading the configuration would always fail. [secure-config-tool](https://www.npmjs.com/package/@tsmx/secure-config-tool) adds the HMAC by default when creating secured configuration files.

To get more information on how the HMAC creation & validation works under the hood, please refer to the package [object-hmac](https://www.npmjs.com/package/@tsmx/object-hmac) which is used for that. The HMAC value is created out of the entire configuration object before optional encryption is applied.

### hmacProperty

Type: `String`
Default: `__hmac`

The name of the HMAC property in a configuration file to be validated against. Only used when [hmacValidation](#hmacValidation) is set tor `true`.

Example configuration file using a custom HMAC property name:
```json
{
  "database": {
    "host": "127.0.0.1",
    "user": "ENCRYPTED|50ceed2f97223100fbdf842ecbd4541f|df9ed9002bfc956eb14b1d2f8d960a11",
    "pass": "ENCRYPTED|8fbf6ded36bcb15bd4734b3dc78f2890|7463b2ea8ed2c8d71272ac2e41761a35"
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

### directory

Type: `String`
Default: `./conf/`

Use this parameter to change the directory where the configuration files should be loaded from.

E.g. if the files are located under `/var/myapp/configurations`:

```js
const confOptions = {
    directory: '/var/myapp/configurations'
}
const conf = require('@tsmx/secure-config')(confOptions);
```

This option can be combined with the [prefix](#prefix) option to control the configuration filenames within the directory. [Naming conventions](#naming-conventions) according to `NODE_ENV` are applied as normal.

***Hint:*** Setting a relative path within the current running app or an unit-test can easily be achieved by using `path.join` with `process.cwd`. E.g. if the files are located in `./test/configurations`.

```js
const confOptions = {
    directory: path.join(process.cwd(), 'test/configurations')
}
```

### prefix

Type: `String`
Default: `config`

Use this parameter to change the default file name pattern from `config-[NODE_ENV].json` to `[prefix]-[NODE_ENV].json` for loading files with deviating names or additional ones. The value of `NODE_ENV` will be evaluated as described in the [naming conventions](#naming-conventions).

To load multiple configurations, use the following pattern in your code.

```js
const secureConf = require('@tsmx/secure-config');
const config = secureConf();
const myconf = secureConf({ prefix: 'myconf', keyVariable: 'MYCONF_KEY' });
```

This example will load the default `config.json` using the the key from environment variable `CONFIG_ENCRYPTION_KEY` as well as the additional `myconf.json` using  the key from `MYCONF_KEY`. Note that different configurations should use different encryption keys. 

Depending on the value of `NODE_ENV` the following configuration files will be loaded in this example.

| Value of NODE_ENV | variable             | Filename                                                   | 
|-------------------|----------------------|------------------------------------------------------------|
| not set           | `config`<br>`myconf` | conf/config.json<br>conf/myconf.json                       | 
| `production`      | `config`<br>`myconf` | conf/config-production.json<br>conf/myconf-production.json | 
| `test`            | `config`<br>`myconf` | conf/config-test.json<br>conf/myconfig-test.json           |

### envVarExports

Type: `Array`
Default: `[]`

With `envVarExports` you can set environment variables out of configuration items by passing an array of objects each having a `key` and `envVar` property where:
- `key` is the name of a configuration item
- `envVar` is the name of the environment variable to be set with the value of the configuration item
- both properties must be of type string

If the configuration item is not at the top level of the configuration JSON, simply pass the full path to it using dotted notation (see example below). 

Suppose you have the following configuation...

```json
{
  "database": {
    "host": "127.0.0.1",
    "user": "ENCRYPTED|50ceed2f97223100fbdf842ecbd4541f|df9ed9002bfc956eb14b1d2f8d960a11",
    "pass": "ENCRYPTED|8fbf6ded36bcb15bd4734b3dc78f2890|7463b2ea8ed2c8d71272ac2e41761a35"
  }
 }
```

...and need to set the database user and password as environment variables `DB_USER` and `DB_PASSWORD`. Then simply pass the following `envVarExports` array.

```js
const envVarExports = [
  { key: 'database.user', envVar: 'DB_USER' },
  { key: 'database.pass', envVar: 'DB_PASSWORD' }
];
const conf = require('@tsmx/secure-config')({ envVarExports });
```

This will automatically set the env vars `DB_USER` and `DB_PASSWORD` with the decrypted configuration item values.

Notes:
- If the `envVarExports` array contains multiple entries having the exact same `key`, only the first entry will be considered.
- If `envVarExports` contains entries that cannot be found in the configuration, no env var will be set and no error will be thrown.

## Injecting the decryption key

The key for decrypting the encrypted values is derived from an environment variable. The default name of this variable is `CONFIG_ENCRYPTION_KEY`, but you can also pass any other name via [options](#options). You can set the environment variable whatever way is most suitable, e.g.

- set/export in the command line or in your bash pofile
  ```
  export CONFIG_ENCRYPTION_KEY=0123456789qwertzuiopasdfghjklyxc
  ```
- using an env block in your VS-Code launch configuration
  ```json
  "env": {
    "CONFIG_ENCRYPTION_KEY": "0123456789qwertzuiopasdfghjklyxc"
  }
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

## Generating an encrypted configuration

### Option 1: secure-config-tool

For better convenience I provided a very basic [secure-config-tool](https://www.npmjs.com/package/@tsmx/secure-config-tool) to easily generate encrypted configuration files with an optional HMAC.

### Option 2: NodeJS crypto functions 

You can also simply use `crypto` functions from NodeJS with the following snippet to create the encrypted entries in a configuration file on your own:

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

In versions before 2.x, secure-config directly exported the configuration object when requiring in the module. To add more flexibility and being able to provide new features, this was changed in the 2.x versions. The module now exports a function which can receive additional [options](#options). 

Since there's a full backward compatibility, all you have to do in your existing code using version 1.x so far is to invoke the function by adding a set of parenthesis.

```js
// version 1.x - requiring in without any function call
const conf = require('@tsmx/secure-config');

// version 2.x - change to that for retaining full backward compatibility
const conf = require('@tsmx/secure-config')();

// use conf as you did before...
```

## SBOM

This package ships with a CycloneDX software bill of materials (SBOM) v1.6 in JSON format as required by some regulatory like the BSI TR-03183. The file is located under the `sbom` folder.

## Changelog

### 2.1.0
- Support for encrypted properties of objects in arrays added, e.g. `{  configArray: [ { key: 'ENCRYPTED|...' }, { key: 'ENCRYPTED|... ' } ] }`

### 2.2.0
- Support for loading multiple configurations with new option [prefix](#prefix) added.

### 2.3.0
- Support for custom configuration file path with new option [directory](#directory) added.

### 2.3.1
- [SBOM](#SBOM) added to shipped files

## Test

```
npm install
npm test
```