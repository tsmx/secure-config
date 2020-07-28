describe('Config test suite', () => {

    beforeEach(() => {
        jest.resetModules();
        delete process.env['CONFIG_ENCRYPTION_KEY'];
        delete process.env['NODE_ENV'];
    });

    it('tests a successful production configuration retrival', async (done) => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config');
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Prod');
        expect(conf.database.password).toBe('SecretPassword-Prod');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword-Prod');
        done();
    });

    it('tests a successful development configuration retrival', async (done) => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = '';
        const conf = require('../secure-config');
        expect(conf.database.host).toBe('127.0.0.1');
        expect(conf.database.user).toBe('SecretUser');
        expect(conf.database.password).toBe('SecretPassword');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword');
        expect(conf.testarray).toBeDefined();
        expect(Array.isArray(conf.testarray)).toBeTruthy();
        expect(conf.testarray.length).toBe(3);
        done();
    });

    it('tests a successful configuration retrival without any encryption', async (done) => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'unencrypted';
        const conf = require('../secure-config');
        expect(conf.database.host).toBe('127.0.0.1');
        expect(conf.database.user).toBe('dbuser');
        expect(conf.database.password).toBe('dbpass');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('storagepass');
        done();
    });

    it('tests a failed configuration retrival because of a missing encryption key', async (done) => {
        process.env['NODE_ENV'] = '';
        expect(() => { const conf = require('../secure-config'); }).toThrow('Environment variable CONFIG_ENCRYPTION_KEY not set.');
        done();
    });

    it('tests a failed configuration retrival because of an encryption key which length is not 32 bytes', async (done) => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjkly';
        process.env['NODE_ENV'] = '';
        expect(() => { const conf = require('../secure-config'); }).toThrow('CONFIG_ENCRYPTION_KEY length must be 32 bytes.');
        done();
    });

    it('tests a failed configuration retrival because of a not existing configuration file', async (done) => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'UNKNOWN';
        expect(() => { const conf = require('../secure-config'); }).toThrow('Configuration file for NODE_ENV UNKNOWN does not exist.');
        done();
    });
});