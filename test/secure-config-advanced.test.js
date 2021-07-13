describe('secure-config adcanced features test suite (v2 features)', () => {

    beforeEach(() => {
        jest.resetModules();
        delete process.env['CONFIG_ENCRYPTION_KEY'];
        delete process.env['CUSTOM_CONFIG_KEY'];
        delete process.env['NODE_ENV'];
    });

    it('tests a successful production configuration retrival with custom key variable name', async (done) => {
        process.env['CUSTOM_CONFIG_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config')({ keyVariable: 'CUSTOM_CONFIG_KEY' });
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Prod');
        expect(conf.database.password).toBe('SecretPassword-Prod');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword-Prod');
        done();
    });

    it('tests a successful production configuration retrival with HMAC validation', async (done) => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config')({ hmacValidation: true });
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Prod');
        expect(conf.database.password).toBe('SecretPassword-Prod');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword-Prod');
        done();
    });

    it('tests a successful production configuration retrival with HMAC validation and a custom property name', async (done) => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production-hmacproperty';
        const conf = require('../secure-config')({ hmacValidation: true, hmacProperty: '_signature' });
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Prod');
        expect(conf.database.password).toBe('SecretPassword-Prod');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword-Prod');
        done();
    });

    it('tests a failed production configuration retrival because of a failed HMAC validation (HMAC manipulated)', async (done) => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production-hmacerror';
        expect(() => { const conf = require('../secure-config')({ hmacValidation: true }); }).toThrow('HMAC validation failed.');
        done();
    });

    it('tests a failed production configuration retrival because of a failed HMAC validation (configuration value manipulated)', async (done) => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production-hmacerror2';
        expect(() => { const conf = require('../secure-config')({ hmacValidation: true }); }).toThrow('HMAC validation failed.');
        done();
    });

});