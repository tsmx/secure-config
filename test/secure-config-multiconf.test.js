const path = require('path');

describe('secure-config multiconf feature test suite (v2 features)', () => {

    const myconfKey = '11c4b6c3cdb7ebaff74a7a340d30c45fd2f7a49d6d0b56badb300dbe49f233ec';
    const confKey = '0123456789qwertzuiopasdfghjklyxc';

    beforeEach(() => {
        jest.resetModules();
        delete process.env['CONFIG_ENCRYPTION_KEY'];
        delete process.env['CUSTOM_CONFIG_KEY'];
        delete process.env['NODE_ENV'];
    });

    it('tests a successful production configuration retrieval with custom file prefix', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = myconfKey;
        const conf = require('../secure-config')({ prefix: 'myconf' });
        expect(conf.info).toEqual('myconf');
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

    it('tests a successful production configuration retrieval with custom file prefix and custom key variable name', () => {
        process.env['CUSTOM_CONFIG_KEY'] = myconfKey;
        const conf = require('../secure-config')({ prefix: 'myconf', keyVariable: 'CUSTOM_CONFIG_KEY' });
        expect(conf.info).toEqual('myconf');
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

    it('tests a successful production configuration retrieval with custom file prefix and HMAC validation', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = myconfKey;
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config')({ prefix: 'myconf', hmacValidation: true });
        expect(conf.info).toEqual('myconf');
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

    it('tests a successful retrieval for two production configurations including HMAC validation', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = confKey;
        process.env['MYCONFIG_ENCRYPTION_KEY'] = myconfKey;
        process.env['NODE_ENV'] = 'production';
        const secureConf = require('../secure-config');
        const conf = secureConf({ hmacValidation: true });
        const myconf = secureConf({ prefix: 'myconf', hmacValidation: true, keyVariable: 'MYCONFIG_ENCRYPTION_KEY' });
        expect(conf.info).toBeUndefined();
        expect(conf.database.host).toBe('db.prod.com');
        expect(conf.database.user).toBe('SecretUser-Prod');
        expect(conf.database.password).toBe('SecretPassword-Prod');
        expect(myconf.info).toEqual('myconf');
        expect(myconf.database.host).toBe('db.prod.com');
        expect(myconf.database.user).toBe('SecretUser-Prod');
        expect(myconf.database.password).toBe('SecretPassword-Prod');
    });

    it('tests a successful production configuration retrieval with custom directory', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = confKey;
        process.env['NODE_ENV'] = 'production';
        const conf = require('../secure-config')({ directory: path.join(process.cwd(), 'test/configurations') });
        expect(conf.info).toEqual('production-custom-dir');
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

    it('tests a successful production configuration retrieval with custom file prefix and custom directory', () => {
        process.env['CONFIG_ENCRYPTION_KEY'] = myconfKey;
        const conf = require('../secure-config')({ prefix: 'myconf', directory: path.join(process.cwd(), 'test/configurations') });
        expect(conf.info).toEqual('myconf-custom-dir');
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

});