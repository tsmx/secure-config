describe('secure-config multiconf feature test suite (v2 features)', () => {

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
    });

    it('tests a successful configuration retrieval with custom name and a top level env var setting', () => {
        expect(process.env['CONFIG_INFO']).toBeUndefined();
        process.env['CONFIG_ENCRYPTION_KEY'] = myconfKey;
        const conf = require('../secure-config')({ prefix: 'myconf', envVarExports: [{ key: 'info', envVar: 'CONFIG_INFO' }] });
        expect(conf.info).toEqual('myconf');
        expect(process.env['CONFIG_INFO']).toBeDefined();
        expect(process.env['CONFIG_INFO']).toEqual('myconf');
    });

    it('tests a successful production configuration retrieval with multiple deep-level env var settings', () => {
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

    it('tests a successful production configuration retrieval with env var settings via the configuration file', () => {
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

});