/**
 * User: DennisHoeting
 * Date: 22.05.13
 * Time: 08:10
 *
 * $
 */

suite('HTTP Socket Handler Tests', function () {
    var assert = require('node-assertthat');
    var q = require('q');
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
    var HTTPSocketHandler = require('./../../../ServerApplication/handlers/httpSocketHdl.js').HTTPSocketHandler;
    var httpSocketHandler = undefined;

    var USERID = 1;
    var ACTIONTYPE = 2;
    var ACTIONID = 3;
    var USERNAME = 'someUser';
    var USERPASS = 'somePass';
    var POINTS = 450238;

    var responseCodes = {
        OK: 200,
        ACCEPTED: 202,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        SERVICE_UNAVAILABLE: 503
    };

    var standardDatabasePromise = function () {
        var deferred = q.defer();
        if (current.databaseRunning) {
            deferred.resolve(true);
        } else {
            deferred.reject(new Error('Database not running'));
        }
        return deferred.promise;
    };

    var databaseMock = {
        login: function () {
            var deferred = q.defer();
            if (current.databaseRunning) {
                deferred.resolve({id: USERID, email: USERNAME, password: USERPASS, isactive: true});
            } else {
                deferred.reject(new Error('Database not running'));
            }
            return deferred.promise;
        },
        pushAction: function () {
            var deferred = q.defer();
            if (current.databaseRunning) {
                deferred.resolve(ACTIONID);
            } else {
                deferred.reject(new Error('Database not running'));
            }
            return deferred.promise;
        },
        endAction: standardDatabasePromise,
        addWifiRouter: standardDatabasePromise,
        addBluetoothSensor: standardDatabasePromise,
        pushGpsData: standardDatabasePromise,
        pushWifiData: standardDatabasePromise,
        pushBluetoothSensorData: standardDatabasePromise,
        pushBluetoothAddress: standardDatabasePromise,
        getUserPoints: function () {
            var deferred = q.defer();
            if (current.databaseRunning) {
                deferred.resolve({points: POINTS});
            } else {
                deferred.reject(new Error('Database not running'));
            }
            return deferred.promise;
        },
        getWifiRouterTypes: function () {
            var deferred = q.defer();
            if (current.databaseRunning) {
                deferred.resolve({
                    rowCount: 2,
                    rows: [
                        {id: 2, name: 'Derivated Wifi Router', heartbeatexpected: false},
                        {id: 1, name: 'Primary Wifi Router', heartbeatexpected: true}
                    ]});
            } else {
                deferred.reject(new Error('Database not running'));
            }
            return deferred.promise;
        },
        getBluetoothSensorTypes: function () {
            var deferred = q.defer();
            if (current.databaseRunning) {
                deferred.resolve({
                    rowCount: 2,
                    rows: [
                        {id: 1, name: 'Static Bluetooth Sensor'},
                        {id: 2, name: 'Mobile Bluetooth Sensor'}
                    ]});
            } else {
                deferred.reject(new Error('Database not running'));
            }
            return deferred.promise;
        }
    };

    var standardFactoryPromise = function () {
        var deferred = q.defer();
        deferred.resolve({data: 'some'});
        return deferred.promise;
    };
    var dataFactoryMock = {
        getLoginData: standardFactoryPromise,
        getUserPointRequestData: standardFactoryPromise,
        getStartActionData: standardFactoryPromise,
        getStopActionData: standardFactoryPromise,
        getPushGPSData: standardFactoryPromise,
        getPushWifiData: standardFactoryPromise,
        getAddWifiRouterData: standardFactoryPromise,
        getAddBluetoothData: standardFactoryPromise,
        getPushBluetoothSensorData: standardFactoryPromise
    };

    var current;

    setup(function () {
        req = {
            method: 'POST'
        };
        res = {
            writeHead: function (statusCode, header) {
                current.statusCode = statusCode;
                current.header = header;
            },
            write: function (toWrite) {
                current.lastWritten += toWrite;
            },
            end: function () {
                current.ended = true;
            }
        };

        httpSocketHandler = new HTTPSocketHandler({
            databaseCtrl: databaseMock,
            logger: logger,
            dataFactory: dataFactoryMock
        });

        current = {
            statusCode: -1,
            header: undefined,
            ended: false,
            lastWritten: '',
            databaseRunning: true
        };
    });

    suite('processLogin', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy Path', function (done) {
            httpSocketHandler.processLogin(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.ACCEPTED));
                assert.that(current.lastWritten, is.equalTo(JSON.stringify({userId: USERID})));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });

        test('Database not running', function (done) {
            current.databaseRunning = false;
            httpSocketHandler.processLogin(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.SERVICE_UNAVAILABLE));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });
    });

    suite('processStartAction', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy Path', function (done) {
            httpSocketHandler.processStartAction(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.NO_CONTENT));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });

        test('Database not running', function (done) {
            current.databaseRunning = false;
            httpSocketHandler.processStartAction(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.SERVICE_UNAVAILABLE));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });
    });


    suite('processStopAction', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy Path', function (done) {
            httpSocketHandler.processStopAction(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.OK));
                assert.that(current.lastWritten, is.not.undefined());
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });

        test('Database not running', function (done) {
            current.databaseRunning = false;
            httpSocketHandler.processStopAction(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.SERVICE_UNAVAILABLE));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });
    });

    suite('processGPSData', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy Path', function (done) {
            httpSocketHandler.processGPSData(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.NO_CONTENT));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });

        test('Database not running', function (done) {
            current.databaseRunning = false;
            httpSocketHandler.processGPSData(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.SERVICE_UNAVAILABLE));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });
    });

    suite('processWIFIData', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy Path', function (done) {
            httpSocketHandler.processWIFIData(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.NO_CONTENT));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });

        test('Database not running', function (done) {
            current.databaseRunning = false;
            httpSocketHandler.processWIFIData(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.SERVICE_UNAVAILABLE));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });
    });

    suite('processPushBluetoothSensorData', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy path', function () {
            //TODO:
        });
    });

    suite('processMobileBluetoothData', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy path', function () {
            //TODO:
        });
    });

    suite('processPointRequest', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy Path', function (done) {
            httpSocketHandler.processPointRequest(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.OK));
                assert.that(current.lastWritten, is.equalTo(JSON.stringify({points: POINTS})));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });

        test('Database not running', function (done) {
            current.databaseRunning = false;
            httpSocketHandler.processPointRequest(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.SERVICE_UNAVAILABLE));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });
    });

    suite('processAddBluetooth', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy Path', function (done) {
            httpSocketHandler.processAddBluetooth(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.NO_CONTENT));
                done();
            }, 50);
        });
    });

    suite('processAddWifi', function () {
        setup(function () {
            req.body = {some:'data'};
        });

        test('Happy Path', function (done) {
            httpSocketHandler.processAddWifi(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.OK));
                assert.that(current.ended, is.true());
                done();
            });
        });

        test('Database not running', function (done) {
            current.databaseRunning = false;
            httpSocketHandler.processAddWifi(req, res);
            setTimeout(function () {
                assert.that(current.statusCode, is.equalTo(responseCodes.SERVICE_UNAVAILABLE));
                assert.that(current.ended, is.true());
                done();
            }, 50);
        });
    });
});