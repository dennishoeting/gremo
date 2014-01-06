/**
 * User: DennisHoeting
 * Date: 21.05.13
 * Time: 18:48
 *
 * $
 */
suite('SMTP Controller Tests', function () {
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

    var SmtpController = require('./../../../WebApplication/controllers/smtpCtrl.js').SMTPController;
    var smtp;
    var connected = false;
    var sent;

    setup(function () {
        sent = false;

        smtp = new SmtpController({
            emailjs: {
                server: {
                    connect: function () {
                        connected = true;
                        return {
                            send: function (parameters, callback) {
                                sent = true;
                                callback();
                            }
                        }
                    }
                }
            },
            q: require('q'),
            logger: logger
        });


    });


    test('connection test', function () {
        assert.that(connected, is.true());

        assert.that(SmtpController.bind(this, undefined), is.throwing());
    });

    suite('sendDummyMail', function () {
        test('Happy Path', function () {
            smtp.sendDummyMail();
            assert.that(sent, is.true());
        });
    });

    suite('sendPostRegistrationMail', function () {
        var params;
        setup(function () {
            params = {
                to: 'someone',
                code: 'someCode'
            };
        });

        test('Happy Path', function (done) {
            smtp.sendPostRegistrationMail(params)
                .then(function () {
                    assert.that(sent, is.true());
                    done();
                });
        });

        test('Exception', function (done) {
            params = undefined;
            smtp.sendPostRegistrationMail(params)
                .fail(function () {
                    assert.that(sent, is.false());
                    done();
                });

        });

        test('Exception', function (done) {
            params.to = undefined;
            smtp.sendPostRegistrationMail(params)
                .fail(function () {
                    assert.that(sent, is.false());
                    done();
                });
        });

        test('Exception', function (done) {
            params.code = undefined;
            smtp.sendPostRegistrationMail(params)
                .fail(function () {
                    assert.that(sent, is.false());
                    done();
                });
        });
    });

    suite('sendResetPasswordMail', function () {
        var params;
        setup(function () {
            params = {
                to: 'someone',
                code: 'someCode',
                password: 'somePass'
            };
        });
        test('Happy Path', function (done) {
            setTimeout(function () {
                smtp.sendResetPasswordMail(params)
                    .then(function () {
                        assert.that(sent, is.true());
                        done();
                    });
            }, 10);
        });

        test('Exception', function (done) {
            params = undefined;
            smtp.sendResetPasswordMail(params)
                .fail(function () {
                    assert.that(sent, is.false());
                    done();
                });
        });

        test('Exception', function (done) {
            params.to = undefined;
            smtp.sendResetPasswordMail(params)
                .fail(function () {
                    assert.that(sent, is.false());
                    done();
                });
        });

        test('Exception', function (done) {
            params.code = undefined;
            smtp.sendResetPasswordMail(params)
                .fail(function () {
                    assert.that(sent, is.false());
                    done();
                });
        });

        test('Exception', function (done) {
            params.password = undefined;
            smtp.sendResetPasswordMail(params)
                .fail(function () {
                    assert.that(sent, is.false());
                    done();
                });
        });
    });
});