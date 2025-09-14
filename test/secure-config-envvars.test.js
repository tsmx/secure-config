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

});