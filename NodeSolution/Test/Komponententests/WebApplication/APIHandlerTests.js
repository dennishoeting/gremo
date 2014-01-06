/**
 * User: DennisHoeting
 * Date: 22.05.13
 * Time: 08:10
 *
 * $
 */
suite('API Handler Tests', function () {
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

    var req = undefined, res = undefined;
    var APIH = require('./../../../WebApplication/handlers/apiHdl.js').APIHandler;
    var apiHandler = undefined;
    var current;

    var USERID = 1, USERCODE = 't357c0d3';
    var USER = {
        id: USERID
    };

    webSocketClientMock = {
        emit: function (code, data, callback) {
            callback(current.wsRunning ? null : new Error('ws not running'), USERID);
        }
    };

    passportMock = {
        authenticate: function (strategy, callback) {
            callback(current.authenticated ? null : new Error('not authenticated'), USER);
            return function (req, res) {
                return;
            }
        },
        serializeUser: function () {
            return null;
        },
        deserializeUser: function () {
            return null;
        },
        use: function () {
            return null;
        }
    };

    smtpMock = {
        sendPostRegistrationMail: function (params) {
            return {
                then: function (callback) {
                    callback();
                    return {
                        fail: function (callback) {
                            callback();
                        }
                    }
                }
            };
        }
    };

    cryptMock = {
        getActivationCode: function () {
            return 'someCode';
        },
        getUserIdCode: function (userid) {
            return 'code4' + userid;
        }
    };

    setup(function () {
        var _clientCodesPerId = {}, _clientCodesPerCode = {};
//        _clientCodesPerId[USERID]=USERCODE;
//        _clientCodesPerCode[USERCODE]=USERID;
        apiHandler = new APIH({
            webSocketClient: webSocketClientMock,
            passport: passportMock,
            cryptCtrl: cryptMock,
            smtpCtrl: smtpMock,
            clientCodesPerId: _clientCodesPerId,
            clientCodesPerCode: _clientCodesPerCode,
            q: require('q'),
            logger: logger
        });
        current = {
            authenticated: true,
            loginRunning: true,
            smtpRunning: true,
            wsRunning: true,
            fakeUrl: ''
        };
    });

    suite('register', function () {
        setup(function () {
            req = {
                body: undefined,
                logIn: function (user, callback) {
                    return callback(current.loginRunning ? null : new Error('login not running'));
                },
                logout: function () {
                    return;
                },
                query: {}
            };
            res = {
                redirect: function (url) {
                    current.fakeUrl = url;
                }
            };
        });

        test('Happy Path', function (done) {
            req.body = {
                email: 'test@test.de',
                password: 'test'
            };
            apiHandler.register(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?registrationSuccess=true&regConfirmMail=test@test.de'));
                done();
            }, 10);
        });

        test('register-Test-negative', function (done) {
            req.body = {
                email: 'test@test.e',
                password: 'test'
            };
            apiHandler.register(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?registrationSuccess=false&&errorCode=invalidMail'));
                done();
            }, 10);
        });

        test('register-Test-negative2', function (done) {
            req.body = {
                email: 'test@test.de'
            };
            apiHandler.register(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?registrationSuccess=false&&errorCode=insufficientData'));
                done();
            }, 10);
        });

        test('register-Test-negative2', function (done) {
            req.body = {
                password: 'test'
            };
            apiHandler.register(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?registrationSuccess=false&&errorCode=insufficientData'));
                done();
            }, 10);
        });

        test('register-Test-negative3', function (done) {
            current.wsRunning = false;
            req.body = {
                email: 'test@test.de',
                password: 'test'
            };
            apiHandler.register(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?registrationSuccess=false&&errorCode=pgExcundefined'));
                done();
            }, 10);
        });
    });

    suite('login', function () {
        setup(function () {
            req = {
                body: undefined,
                logIn: function (user, callback) {
                    return callback(current.loginRunning ? null : new Error('login not running'));
                },
                logout: function () {
                    return;
                }
            };
            res = {
                redirect: function (url) {
                    current.fakeUrl = url;
                }
            };
        });

        test('login-Test', function (done) {
            apiHandler.login(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/main?id=' + cryptMock.getUserIdCode(USERID)));
                done();
            }, 10);
        });

        test('login-Test_negative', function (done) {
            current.authenticated = false;
            apiHandler.login(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?loginSuccess=false'));
                done();
            }, 10);
        });

        test('login-Test_negative2', function (done) {
            current.loginRunning = false;
            apiHandler.login(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?loginSuccess=false'));
                done();
            }, 10);
        });
    });

    suite('activate', function () {
        setup(function () {
            req = {
                body: undefined,
                logIn: function (user, callback) {
                    return callback(current.loginRunning ? null : new Error('login not running'));
                },
                logout: function () {
                    return;
                }
            };
            res = {
                redirect: function (url) {
                    current.fakeUrl = url;
                }
            };
        });

        test('activate-Test', function (done) {
            apiHandler.activate(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?activationSuccess=true'));
                done();
            }, 10);
        });

        test('activate-Test_negative', function (done) {
            current.wsRunning = false;
            apiHandler.activate(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?activationSuccess=false'));
                done();
            }, 10);
        });
    });

    suite('confirmPasswordReset', function () {
        setup(function () {
            req = {
                body: undefined,
                logIn: function (user, callback) {
                    return callback(current.loginRunning ? null : new Error('login not running'));
                },
                logout: function () {
                    return;
                }
            };
            res = {
                redirect: function (url) {
                    current.fakeUrl = url;
                }
            };
        });

        test('confirmPasswordReset-Test', function (done) {
            apiHandler.confirmPasswordReset(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?resetSuccess=true'));
                done();
            }, 10);
        });

        test('confirmPasswordReset-Test_negative', function (done) {
            current.wsRunning = false;
            apiHandler.confirmPasswordReset(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?resetSuccess=false'));
                done();
            }, 10);
        });
    });

    suite('logout', function () {
        setup(function () {
            req = {
                body: undefined,
                logIn: function (user, callback) {
                    return callback(current.loginRunning ? null : new Error('login not running'));
                },
                logout: function () {
                    return;
                }
            };
            res = {
                redirect: function (url) {
                    current.fakeUrl = url;
                }
            };
        });

        test('logout-Test', function (done) {
            apiHandler.logout(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/login?logoutSuccess=true'));
                done();
            }, 10);
        });

        test('fallback-Test', function (done) {
            req.url = '/something'
            apiHandler.fallback(req, res);
            setTimeout(function () {
                assert.that(current.fakeUrl, is.equalTo('/verify?dest=/something'));
                done();
            }, 10);
        });
    });
});