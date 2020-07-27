# [**secure-config**](https://github.com/tsmx/secure-config)

Handling multi-environment configurations with encrypted secrets.

Benefits:
- No need to "hide" you configuration files from code repos etc.
- The only things to keep secret is one key per environment.
- No need to use 3rd party secret stores like GCP KMS, Vault or something
- Pure NodeJS solution, no dependencies
- Uses standard environment variable technique to inject the only secret you need

The cipher used is AES-256-CBC.

## Usage

Configuration file with encrypted values:
```json
{
    "database": {
        "host": "127.0.0.1",
        "user": "ENCRYPTED|9edcd5a6bc5ed6868e6c3340019f5d3a|bc1857aab6981b903fab75ccb5c5244b",
        "pass": "ENCRYPTED|45aa7c597b470d24c4552ff9b7a5b919|30c26f4fb8e63f2986b1a605028b5dd8"
    }
}
```

Your code:

```js
const conf = require('@tsmx/secure-config');

function MyFunc() {
    let dbHost = conf.database.host;
    let dbUser = conf.database.user;
    let dbPass = conf.database.pass;
    //...
}
});
```
## Injecting the decryption key

The key for decrypting the encrypted values is derived from an environment varibale named `CONFIG_ENCRYPTION_KEY`. You can set this variable 
whatever way is most suitable, e.g.
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
- etc.

The key length must be 32 bytes!

## Generating encrypted entries

Simply use `crypto` functions from NodeJS with the follwing snippet to create the encrypted entries or use the very basic [secure-config-tool](https://github.com/tsmx/secure-config-tool) for that.

```js
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

var key = Buffer.from('YOUR_KEY_HERE');

function encrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return 'ENCRYPTED|' + iv.toString('hex') + '|' + encrypted.toString('hex');
}
```

The generated encrypted entry always has the form: `ENCRYPTED | Cipher Initialisation Vector | Encrypted Data`.

## Configuration file name and directory convention

You can have multiple configuration files for different environments or stages. They are distinguished by the environment variable `NODE_ENV`. The basic configuration file name is `config.json` if this variable is not present. If it is present, a configuration file with the name `config-[NODE_ENV].json`
is used. An exception will be thrown if no configuration file is found.

All configuration files must be located in a `/conf` directory of the current running app, meaning a direct subdirectory of the current working directory (`CWD/conf`).  

Examples:
- Development stage
  - `NODE_ENV`: not set
  - Configuration file: `conf/config.json`
- Prodcution stage
  - `NODE_ENV`: `production`
  - Configuration file: `conf/config-production.json`
- Test stage
  - `NODE_ENV`: `test`
  - Configuration file: `conf/config-test.json`

## Test

```
npm install
npm test
```