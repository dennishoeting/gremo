/**
 * User: DennisHoeting
 * Date: 21.05.13
 * Time: 18:48
 *
 * $
 */
suite('Crypto Controller Tests', function () {
    var assert = require('node-assertthat');
    var log4js = require('log4js');
    log4js.configure({
        appenders: [
            {type: 'console'},
            {type: 'file', filename: 'logs/test.log', category: 'Test.js'}
        ]
    });
    var logger = log4js.getLogger('Test.js')
    logger.setLevel('INFO');

    var CryptoController = require('./../../../WebApplication/controllers/cryptoCtrl.js').CryptoController;
    var crypto;

    setup(function () {
        crypto = new CryptoController({
            crypto: require('crypto')
        });
    });

    /*
     * Suite for method getUserIdCodeTest
     */
    suite('getUserIdCodeTest', function () {
        /*
         * Code must have length of 32
         */
        test('Happy Path', function () {
            var actual = crypto.getUserIdCode(Math.floor(Math.random() * 1000));
            assert.that(actual.length, is.equalTo(32));
        });

        /*
         * Method requires parameter
         */
        test('Exception', function () {
            var id = undefined;
            assert.that(crypto.getUserIdCode.bind(this,id), is.throwing());
        });
    });

    /*
     * Suite for method getActivationCodeTest
     */
    suite('getActivationCodeTest', function () {
        /*
         * Code must have length of 32
         */
        test('Happy Path', function () {
            var actual = crypto.getActivationCode();
            assert.that(actual.length, is.equalTo(32));
        });
    });

    /*
     * Suite for method getPasswordCodeTest
     */
    suite('getPasswordCodeTest', function () {
        /*
         * Code must have length of 32
         */
        test('Happy Path', function () {
            var actual = crypto.getPasswordCode('something' + Math.floor(Math.random() * 100));
            assert.that(actual.length, is.equalTo(32));
        });
        /*
         * Method requires parameter
         */
        test('Exception', function () {
            var pass = undefined;
            assert.that(crypto.getPasswordCode.bind(this,pass), is.throwing());
        });
    });
});