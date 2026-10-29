describe('secure-config environment variables setting test suite', () => {

    const key = '0123456789qwertzuiopasdfghjklyxc';
    const myconfKey = '11c4b6c3cdb7ebaff74a7a340d30c45fd2f7a49d6d0b56badb300dbe49f233ec';

    beforeEach(() => {
        jest.resetModules();
        delete process.env['CONFIG_ENCRYPTION_KEY'];
        delete process.env['CUSTOM_CONFIG_KEY'];
        delete process.env['NODE_ENV'];
        delete process.env['CONFIG_INFO'];
        delete process.env['DB_USER'];
        delete process.env['DB_PASSWORD'];
        delete process.env['DB_USER_2'];
        delete process.env['DB_PASSWORD_2'];
    });

    it('tests a programmatic env var setting from a simple top level configuratisn item', () => {
        expect(process.env['CONFIG_INFO']).toBeUndefined();
        process.env['CONFIG_ENCRYPTION_KEY'] = myconfKey;
        const conf = require('../secure-config')({ prefix: 'myconf', envVarExports: [{ key: 'info', envVar: 'CONFIG_INFO' }] });
        expect(conf.info).toEqual('myconf');
        expect(process.env['CONFIG_INFO']).toBeDefined();
        expect(process.env['CONFIG_INFO']).toEqual('myconf');
    });

    it('tests a programmatic env var setting for multiple values from deep-nested configuration items', () => {
        expect(process.env['DB_USER']).toBeUndefined();
        expect(process.env['DB_PASSWORD']).toBeUndefined();
        const envVarExports = [
            { key: 'database.user', envVar: 'DB_USER' },
            { key: 'database.password', envVar: 'DB_PASSWORD' }
        ];
        process.env['CONFIG_ENCRYPTION_KEY'] = key;
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config')({ envVarExports });
        expect(conf.database.host).toEqual('db.prod.com');
        expect(conf.database.user).toEqual('SecretUser-Prod');
        expect(conf.database.password).toEqual('SecretPassword-Prod');
        expect(process.env['DB_USER']).toBeDefined();
        expect(process.env['DB_USER']).toEqual('SecretUser-Prod');
        expect(process.env['DB_PASSWORD']).toBeDefined();
        expect(process.env['DB_PASSWORD']).toEqual('SecretPassword-Prod');
    });

    it('tests a declarative env var setting for multiple values from deep-nested configuration items', () => {
        expect(process.env['DB_USER']).toBeUndefined();
        expect(process.env['DB_PASSWORD']).toBeUndefined();
        process.env['CONFIG_ENCRYPTION_KEY'] = key;
        process.env['NODE_ENV'] = 'production-envvars';
        const conf = require('../secure-config')( { hmacValidation: true });
        expect(conf.database.host).toEqual('db.prod.com');
        expect(conf.database.user).toEqual('SecretUser-Prod');
        expect(conf.database.password).toEqual('SecretPassword-Prod');
        expect(process.env['DB_USER']).toBeDefined();
        expect(process.env['DB_USER']).toEqual('SecretUser-Prod');
        expect(process.env['DB_PASSWORD']).toBeDefined();
        expect(process.env['DB_PASSWORD']).toEqual('SecretPassword-Prod');
    });

    it('tests the precedence of programmatic over declarative env var settings', () => {
        expect(process.env['DB_USER']).toBeUndefined();
        expect(process.env['DB_USER_2']).toBeUndefined();
        expect(process.env['DB_PASSWORD']).toBeUndefined();
        expect(process.env['DB_PASSWORD_2']).toBeUndefined();
        process.env['CONFIG_ENCRYPTION_KEY'] = key;
        process.env['NODE_ENV'] = 'production-envvars';
        const envVarExports = [
            { key: 'database.user', envVar: 'DB_USER_2' },
            { key: 'database.password', envVar: 'DB_PASSWORD_2' }
        ];
        const conf = require('../secure-config')( { hmacValidation: true, envVarExports });
        expect(conf.database.host).toEqual('db.prod.com');
        expect(conf.database.user).toEqual('SecretUser-Prod');
        expect(conf.database.password).toEqual('SecretPassword-Prod');
        expect(process.env['DB_USER']).toBeUndefined();
        expect(process.env['DB_USER_2']).toBeDefined();
        expect(process.env['DB_USER_2']).toEqual('SecretUser-Prod');
        expect(process.env['DB_PASSWORD']).toBeUndefined();
        expect(process.env['DB_PASSWORD_2']).toBeDefined();
        expect(process.env['DB_PASSWORD_2']).toEqual('SecretPassword-Prod');
    });

    it('tests a programmatic env var setting with multiple same keys, first should take effect', () => {
        expect(process.env['DB_USER']).toBeUndefined();
        expect(process.env['DB_USER_2']).toBeUndefined();
        const envVarExports = [
            { key: 'database.user', envVar: 'DB_USER' },
            { key: 'database.user', envVar: 'DB_USER_2' }
        ];
        process.env['CONFIG_ENCRYPTION_KEY'] = key;
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config')({ envVarExports });
        expect(conf.database.host).toEqual('db.prod.com');
        expect(conf.database.user).toEqual('SecretUser-Prod');
        expect(conf.database.password).toEqual('SecretPassword-Prod');
        expect(process.env['DB_USER']).toBeDefined();
        expect(process.env['DB_USER']).toEqual('SecretUser-Prod');
        expect(process.env['DB_USER_2']).toBeUndefined();
    });

    describe('deny-list for exports defined in the configuration', () => {

        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        let tmpDir;

        function loadWithConfigExports(envVarExports, options = {}) {
            jest.resetModules();
            fs.writeFileSync(path.join(tmpDir, 'config.json'), JSON.stringify({
                database: { host: 'db.test.com', user: 'plainuser' },
                __envVarExports: envVarExports
            }));
            process.env['CONFIG_ENCRYPTION_KEY'] = key;
            return require('../secure-config')({ directory: tmpDir, ...options });
        }

        beforeEach(() => {
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'secure-config-'));
        });

        afterEach(() => {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        });

        it.each([
            'NODE_OPTIONS', 'node_options', 'NODE_ENV', 'NODE_PATH', 'PATH', 'LD_PRELOAD', 'ld_library_path',
            'DYLD_INSERT_LIBRARIES', 'NPM_CONFIG_REGISTRY', 'CONFIG_ENCRYPTION_KEY', 'config_encryption_key'
        ])('rejects the denied env var %s in a configuration export', (envVar) => {
            process.env['CONFIG_ENCRYPTION_KEY'] = key;
            const original = process.env[envVar];
            expect(() => loadWithConfigExports([{ key: 'database.host', envVar }])).toThrow('is not allowed');
            expect(process.env[envVar]).toEqual(original);
        });

        it('rejects the custom key variable name in a configuration export', () => {
            process.env['CUSTOM_CONFIG_KEY'] = key;
            fs.writeFileSync(path.join(tmpDir, 'config.json'), JSON.stringify({
                database: { host: 'db.test.com' },
                __envVarExports: [{ key: 'database.host', envVar: 'CUSTOM_CONFIG_KEY' }]
            }));
            expect(() => require('../secure-config')({ directory: tmpDir, keyVariable: 'CUSTOM_CONFIG_KEY' })).toThrow('is not allowed');
            expect(process.env['CUSTOM_CONFIG_KEY']).toEqual(key);
        });

        it('rejects a denied env var even if its key is not present in the configuration', () => {
            expect(() => loadWithConfigExports([{ key: 'does.not.exist', envVar: 'NODE_OPTIONS' }])).toThrow('is not allowed');
        });

        it('rejects additional names passed via envVarDenyList, exact and with prefix', () => {
            expect(() => loadWithConfigExports([{ key: 'database.host', envVar: 'HTTP_PROXY' }], { envVarDenyList: ['http_proxy'] })).toThrow('is not allowed');
            expect(() => loadWithConfigExports([{ key: 'database.host', envVar: 'MYAPP_SECRET' }], { envVarDenyList: ['MYAPP_*'] })).toThrow('is not allowed');
            expect(process.env['HTTP_PROXY']).not.toEqual('db.test.com');
            expect(process.env['MYAPP_SECRET']).toBeUndefined();
        });

        it('still allows non-denied names via configuration, also with envVarDenyList set', () => {
            const conf = loadWithConfigExports([{ key: 'database.user', envVar: 'DB_USER' }], { envVarDenyList: ['HTTP_PROXY'] });
            expect(conf.database.user).toEqual('plainuser');
            expect(process.env['DB_USER']).toEqual('plainuser');
        });

        it('does not apply the deny-list to programmatically passed exports', () => {
            const original = process.env['HTTP_PROXY'];
            try {
                loadWithConfigExports([], { envVarExports: [{ key: 'database.host', envVar: 'HTTP_PROXY' }], envVarDenyList: ['HTTP_PROXY'] });
                expect(process.env['HTTP_PROXY']).toEqual('db.test.com');
            }
            finally {
                if (original === undefined) { delete process.env['HTTP_PROXY']; } else { process.env['HTTP_PROXY'] = original; }
            }
        });

        it('ignores configuration exports with a non-string envVar instead of setting a bogus variable', () => {
            loadWithConfigExports([{ key: 'database.host', envVar: { a: 1 } }, { key: 'database.host' }]);
            expect(process.env['[object Object]']).toBeUndefined();
            expect(process.env['undefined']).toBeUndefined();
        });

    });

});