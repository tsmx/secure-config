describe('secure-config adcanced features test suite (v2 features)', () => {

    beforeEach(() => {
        jest.resetModules();
        delete process.env['CONFIG_ENCRYPTION_KEY'];
        delete process.env['CUSTOM_CONFIG_KEY'];
        delete process.env['NODE_ENV'];
    });

    it('tests a successful production configuration retrival with custom key variable name', () => {
        process.env['CUSTOM_CONFIG_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config')({ keyVariable: 'CUSTOM_CONFIG_KEY' });
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Prod');
        expect(conf.database.password).toBe('SecretPassword-Prod');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword-Prod');
    });

    it('tests a successful production configuration retrival with HMAC validation', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config')({ hmacValidation: true });
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Prod');
        expect(conf.database.password).toBe('SecretPassword-Prod');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword-Prod');
    });

    it('tests a successful production configuration retrival with HMAC validation and a custom property name', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production-hmacproperty';
        const conf = require('../secure-config')({ hmacValidation: true, hmacProperty: '_signature' });
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Prod');
        expect(conf.database.password).toBe('SecretPassword-Prod');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword-Prod');
    });

    it('tests a failed production configuration retrival because of a failed HMAC validation (HMAC manipulated)', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production-hmacerror';
        expect(() => { require('../secure-config')({ hmacValidation: true }); }).toThrow('HMAC validation failed.');
    });

    it('tests a failed production configuration retrival because of a failed HMAC validation (configuration value manipulated)', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production-hmacerror2';
        expect(() => { require('../secure-config')({ hmacValidation: true }); }).toThrow('HMAC validation failed.');
    });

});