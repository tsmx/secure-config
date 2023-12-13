describe('secure-config basic features test suite (v1 features)', () => {

    beforeEach(() => {
        jest.resetModules();
        delete process.env['CONFIG_ENCRYPTION_KEY'];
        delete process.env['NODE_ENV'];
    });

    it('tests a successful production configuration retrieval', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config')();
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Prod');
        expect(conf.database.password).toBe('SecretPassword-Prod');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword-Prod');
        expect(conf.testarray.length).toEqual(2);
        expect(conf.testarray[0].arrayItemKey).toEqual('itemValue1');
        expect(conf.testarray[1].arrayItemKey).toEqual('itemValue2');

    });

    it('tests a successful configuration retrieval with a hexadecimal key', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '9af7d400be4705147dc724db25bfd2513aa11d6013d7bf7bdb2bfe050593bd0f';
        process.env['NODE_ENV'] = 'hex';
        const conf = require('../secure-config')();
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Hex');
        expect(conf.database.password).toBe('SecretPassword-Hex');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword-Hex');
        expect(conf.testarray.length).toEqual(2);
        expect(conf.testarray[0].arrayItemKey).toEqual('itemValue1-Hex');
        expect(conf.testarray[1].arrayItemKey).toEqual('itemValue2-Hex');
    });

    it('tests a successful development configuration retrieval', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = '';
        const conf = require('../secure-config')();
        expect(conf.database.host).toBe('127.0.0.1');
        expect(conf.database.user).toBe('SecretUser');
        expect(conf.database.password).toBe('SecretPassword');
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('StoragePassword');
        expect(conf.testarray).toBeDefined();
        expect(Array.isArray(conf.testarray)).toBeTruthy();
        expect(conf.testarray.length).toBe(6);
        expect(conf.testarray[0]).toEqual('one');
        expect(conf.testarray[1]).toEqual('two');
        expect(conf.testarray[2]).toEqual('three');
        expect(conf.testarray[3].arrayItemKey).toEqual('itemValue1');
        expect(conf.testarray[3].additionalItem1).toEqual('value1');
        expect(conf.testarray[4].arrayItemKey).toEqual('itemValue2');
        expect(conf.testarray[4].additionalItem1).toEqual('value1');
        expect(conf.testarray[4].additionalItem2).toEqual(12);
        expect(conf.testarray[5].length).toEqual(1);
        expect(conf.testarray[5][0].subArrayItemKey).toEqual('subArrayItemValue');
        expect(conf.nullvalue).toBe(null);
    });

    it('tests a successful configuration retrieval without any encryption', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'unencrypted';
        const conf = require('../secure-config')();
        expect(conf.database.host).toBe('127.0.0.1');
        expect(conf.database.user).toBe('dbuser');
        expect(conf.database.password).toBe('dbpass');
        expect(conf.nullVal).toBe(null);
        expect(conf.filestorage.type).toBe('local');
        expect(conf.filestorage.params.folder).toBe('/tmp/storage');
        expect(conf.filestorage.params.storagepass).toBe('storagepass');
    });

    it('tests a failed configuration retrieval because of a missing encryption key', () => {
        process.env['NODE_ENV'] = '';
        expect(() => { require('../secure-config')(); }).toThrow('Environment variable CONFIG_ENCRYPTION_KEY not set.');
    });

    it('tests a failed configuration retrieval because of an encryption key which length is not 32 bytes', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjkly';
        process.env['NODE_ENV'] = '';
        expect(() => { require('../secure-config')(); }).toThrow('CONFIG_ENCRYPTION_KEY length must be 32 bytes.');
    });

    it('tests a failed configuration retrieval because of a not existing configuration file', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklyxc';
        process.env['NODE_ENV'] = 'UNKNOWN';
        expect(() => { require('../secure-config')(); }).toThrow('Configuration file for NODE_ENV UNKNOWN does not exist.');
    });

    it('tests a failed configuration retrieval because of a wrong key', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = '0123456789qwertzuiopasdfghjklXXX';
        process.env['NODE_ENV'] = 'production';
        expect(() => { require('../secure-config')(); }).toThrow();
    });
});