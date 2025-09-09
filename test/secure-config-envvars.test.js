describe('secure-config multiconf feature test suite (v2 features)', () => {

    const myconfKey = '11c4b6c3cdb7ebaff74a7a340d30c45fd2f7a49d6d0b56badb300dbe49f233ec';

    beforeEach(() => {
        jest.resetModules();
        delete process.env['CONFIG_ENCRYPTION_KEY'];
        delete process.env['CUSTOM_CONFIG_KEY'];
        delete process.env['NODE_ENV'];
    });

    it('tests a successful production configuration retrieval with env var setting', () => {
        expect(process.env['CONFIG_INFO']).toBeUndefined();
        process.env['CONFIG_ENCRYPTION_KEY'] = myconfKey;
        const conf = require('../secure-config')({ prefix: 'myconf', exports: [{ key: 'info', envVar: 'CONFIG_INFO' }] });
        expect(conf.info).toEqual('myconf');
        expect(process.env['CONFIG_INFO']).toBeDefined();
        expect(process.env['CONFIG_INFO']).toEqual('myconf');
    });

});