/**
 * User: DennisHoeting
 * Date: 20.06.13
 * Time: 23:44
 *
 * $
 */
suite('Data Factory Tests', function () {
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
    var q = require('q');

    var dataFactory = new (require('./../../../ServerApplication/factories/httpDataFactory.js').HTTPDataFactory)({
        q: q,
        logger: logger,
        underscore: require('underscore')
    });

    suite('getLoginData', function () {
        var req;
        setup(function () {
            req = {
                body: {
                    username: 'someUser',
                    password: 'somePass'
                }
            };
        });

        test('Happy Path', function (done) {
            dataFactory.getLoginData(req)
                .then(function (data) {
                    assert.that(data.login, is.not.undefined());
                    assert.that(data.password, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should reject if body is undefined', function (done) {
            req.body = undefined;
            dataFactory.getLoginData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if username is undefined', function (done) {
            req.body.username = undefined;
            dataFactory.getLoginData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if password is undefined', function (done) {
            req.body.password = undefined;
            dataFactory.getLoginData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });
    });

    suite('getUserPointRequestData', function () {
        var req;
        setup(function () {
            req = {
                params: {
                    userId: 1234
                },
                body: {}
            };
        });

        test('Happy Path', function (done) {
            dataFactory.getUserPointRequestData(req)
                .then(function (data) {
                    assert.that(data.userId, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should reject if params is undefined', function (done) {
            req.params = undefined;
            dataFactory.getUserPointRequestData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if userId is undefined', function (done) {
            req.params.userId = undefined;
            dataFactory.getUserPointRequestData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });
    });

    suite('getStartActionData', function () {
        var req;
        setup(function () {
            req = {
                params: {
                    userId: 1234
                },
                body: {
                    actionType: 421,
                    mac: '42:4c'
                }
            };
        });

        test('Happy Path', function (done) {
            dataFactory.getStartActionData(req)
                .then(function (data) {
                    assert.that(data.userId, is.not.undefined());
                    assert.that(data.mac, is.not.undefined());
                    assert.that(data.typeId, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should reject if params is undefined', function (done) {
            req.params = undefined;
            dataFactory.getStartActionData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if userId is undefined', function (done) {
            req.params.userId = undefined;
            dataFactory.getStartActionData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if body is undefined', function (done) {
            req.body = undefined;
            dataFactory.getStartActionData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if actionType is undefined', function (done) {
            req.body.actionType = undefined;
            dataFactory.getStartActionData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });
    });

    suite('getStopActionData', function () {
        var req;
        setup(function () {
            req = {
                params: {
                    userId: 1234
                },
                body: {}
            };
        });

        test('Happy Path', function (done) {
            dataFactory.getStopActionData(req)
                .then(function (data) {
                    assert.that(data.userId, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should reject if params is undefined', function (done) {
            req.params = undefined;
            dataFactory.getStopActionData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if userId is undefined', function (done) {
            req.params.userId = undefined;
            dataFactory.getStopActionData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });
    });

    suite('getPushGPSData', function () {
        var req;
        setup(function () {
            req = {
                params: {
                    userId: 123
                },
                body: {
                    bulk: [
                        {
                            lat: 53.43,
                            lng: 52.53,
                            time: 14523,
                            speed: 34.3,
                            accuracy: 20.2,
                            providerId: 2
                        },
                        {
                            lat: 53.43,
                            lng: 52.53,
                            time: 14523,
                            speed: 34.3,
                            accuracy: 20.2,
                            providerId: 2
                        },
                        {
                            lat: 53.43,
                            lng: 52.53,
                            time: 14523,
                            speed: 34.3,
                            accuracy: 20.2,
                            providerId: 2
                        }
                    ]
                }
            };
        });

        test('Happy Path', function (done) {
            dataFactory.getPushGPSData(req)
                .then(function (data) {
                    assert.that(data instanceof Array, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should reject if params is undefined', function (done) {
            req.params = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if userId is undefined', function (done) {
            req.params.userId = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if body is undefined', function (done) {
            req.body = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if bulk is undefined', function (done) {
            req.body.bulk = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if speed is undefined', function (done) {
            req.body.bulk[0].speed = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if accuracy is undefined', function (done) {
            req.body.bulk[0].accuracy = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if lng is undefined', function (done) {
            req.body.bulk[0].lng = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if lat is undefined', function (done) {
            req.body.bulk[0].lat = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if time is undefined', function (done) {
            req.body.bulk[0].time = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if providerId is undefined', function (done) {
            req.body.bulk[0].providerId = undefined;
            dataFactory.getPushGPSData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });
    });

    suite('getPushWifiData', function () {
        var req;
        setup(function () {
            req = {
                params: {
                    userId: 123
                },
                body: {
                    bulk: [
                        {
                            time: 646,
                            wifirouterBSSIDs: ['14:c2', '24:ff'],
                            wifirouterSSIDs: ['myWifi1', 'myWifi2']
                        }
                    ]
                }
            };
        });

        test('Happy Path', function (done) {
            dataFactory.getPushWifiData(req)
                .then(function (data) {
                    assert.that(data[0].userId, is.not.undefined());
                    assert.that(data[0].wifirouterBSSIDs, is.not.undefined());
                    assert.that(data[0].wifirouterSSIDs, is.not.undefined());
                    assert.that(data[0].timestamp, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should reject if params is undefined', function (done) {
            req.params = undefined;
            dataFactory.getPushWifiData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if userId is undefined', function (done) {
            req.params.userId = undefined;
            dataFactory.getPushWifiData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if body is undefined', function (done) {
            req.body = undefined;
            dataFactory.getPushWifiData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if time is undefined', function (done) {
            req.body.bulk[0].time = undefined;
            dataFactory.getPushWifiData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if wifirouterBSSIDs is undefined', function (done) {
            req.body.bulk[0].wifirouterBSSIDs = undefined;
            dataFactory.getPushWifiData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if wifirouterBSSIDs is empty', function (done) {
            req.body.bulk[0].wifirouterBSSIDs = [];
            dataFactory.getPushWifiData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if wifirouterSSIDs is undefined', function (done) {
            req.body.bulk[0].wifirouterSSIDs = undefined;
            dataFactory.getPushWifiData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if wifirouterSSIDs is empty', function (done) {
            req.body.bulk[0].wifirouterSSIDs = [];
            dataFactory.getPushWifiData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });
    });

    suite('getAddWifiRouterData', function () {
        var req;
        setup(function () {
            req = {
                body: {
                    bssid: '23:6g',
                    ssid: 'My Wifi',
                    lat: 53.35,
                    lng: 35.38,
                    typeId: 6,
                    pointsperdetection: 5
                }
            };
        });

        test('Happy Path (with pointsperdetection)', function (done) {
            dataFactory.getAddWifiRouterData(req)
                .then(function (data) {
                    assert.that(data.bssid, is.not.undefined());
                    assert.that(data.ssid, is.not.undefined());
                    assert.that(data.typeId, is.not.undefined());
                    assert.that(data.position, is.not.undefined());
                    assert.that(data.pointsperdetection, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path (without pointsperdetection)', function (done) {
            req.body.pointsperdetection = undefined;
            dataFactory.getAddWifiRouterData(req)
                .then(function (data) {
                    assert.that(data.bssid, is.not.undefined());
                    assert.that(data.ssid, is.not.undefined());
                    assert.that(data.typeId, is.not.undefined());
                    assert.that(data.position, is.not.undefined());
                    assert.that(data.pointsperdetection, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should reject if bssid is undefined', function (done) {
            req.body.bssid = undefined;
            dataFactory.getAddWifiRouterData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if ssid is undefined', function (done) {
            req.body.ssid = undefined;
            dataFactory.getAddWifiRouterData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if lat is undefined', function (done) {
            req.body.lat = undefined;
            dataFactory.getAddWifiRouterData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if lng is undefined', function (done) {
            req.body.lng = undefined;
            dataFactory.getAddWifiRouterData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if typeId is undefined', function (done) {
            req.body.typeId = undefined;
            dataFactory.getAddWifiRouterData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });
    });

    suite('getAddBluetoothData', function () {
        var req;
        setup(function () {
            req = {
                body: {
                    bssid: '23:6g',
                    lat: 53.35,
                    lng: 35.38,
                    typeId: 6,
                    pointsperdetection: 5
                }
            };
        });

        test('Happy Path (with pointsperdetection)', function (done) {
            dataFactory.getAddBluetoothData(req)
                .then(function (data) {
                    assert.that(data.bssid, is.not.undefined());
                    assert.that(data.typeId, is.not.undefined());
                    assert.that(data.position, is.not.undefined());
                    assert.that(data.pointsperdetection, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path (without pointsperdetection)', function (done) {
            req.body.pointsperdetection = undefined;
            dataFactory.getAddBluetoothData(req)
                .then(function (data) {
                    assert.that(data.bssid, is.not.undefined());
                    assert.that(data.typeId, is.not.undefined());
                    assert.that(data.position, is.not.undefined());
                    assert.that(data.pointsperdetection, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should reject if bssid is undefined', function (done) {
            req.body.bssid = undefined;
            dataFactory.getAddBluetoothData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if lat is undefined', function (done) {
            req.body.lat = undefined;
            dataFactory.getAddBluetoothData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if lng is undefined', function (done) {
            req.body.lng = undefined;
            dataFactory.getAddBluetoothData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if typeId is undefined', function (done) {
            req.body.typeId = undefined;
            dataFactory.getAddBluetoothData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });
    });

    suite('getPushBluetoothSensorData', function () {
        var req;
        setup(function () {
            req = {
                params: {
                    mac: '12:5f'
                },
                body: {
                    bulk: [
                        {
                            scanResult: [
                                {
                                    bluetoothId: '34:3d',
                                    time: 234,
                                    bluetoothClass: 7936
                                },
                                {
                                    bluetoothId: '3h:fs',
                                    time: 284,
                                    bluetoothClass: 7936
                                }
                            ]
                        }
                    ]

                }
            };
        });

        test('Happy Path', function (done) {
            dataFactory.getPushBluetoothSensorData(req)
                .then(function (data) {
                    assert.that(data[0].bssid, is.not.undefined());
                    assert.that(data[0].actorIds, is.not.undefined());
                    assert.that(data[0].actorIds.length, is.atLeast(1));
                    assert.that(data[0].timestamps, is.not.undefined());
                    assert.that(data[0].timestamps.length, is.atLeast(1));
                    done();
                })
                .fail(function (error) {
                    done(error);
                })
        });

        test('Should reject if params is undefined', function (done) {
            req.params = undefined;
            dataFactory.getPushBluetoothSensorData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if mac is undefined', function (done) {
            req.params.mac = undefined;
            dataFactory.getPushBluetoothSensorData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if body is undefined', function (done) {
            req.body = undefined;
            dataFactory.getPushBluetoothSensorData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if scanResult is undefined', function (done) {
            req.body.bulk[0].scanResult = undefined;
            dataFactory.getPushBluetoothSensorData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if scanResult has one invalid bluetoothid', function (done) {
            req.body.bulk[0].scanResult = [
                {
                    bluetoothId: 1.5,     // INVALID
                    time: 234,
                    bluetoothClass: 7936
                },
                {
                    bluetoothId: '3h:fs',
                    time: 284,
                    bluetoothClass: 7936
                }
            ];
            dataFactory.getPushBluetoothSensorData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });

        test('Should reject if scanResult has one invalid time', function (done) {
            req.body.bulk[0].scanResult = [
                {
                    bluetoothId: '34:3d',
                    time: '234_fa',  // INVALID
                    bluetoothClass: 7936
                },
                {
                    bluetoothId: '3h:fs',
                    time: 284,
                    bluetoothClass: 7936
                }
            ];
            dataFactory.getPushBluetoothSensorData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });


        test('Should reject if scanResult has one invalid bluetoothClass', function (done) {
            req.body.bulk[0].scanResult = [
                {
                    bluetoothId: '34:3d',
                    time: 286,
                    bluetoothClass: 'huhu' // INVALID
                },
                {
                    bluetoothId: '3h:fs',
                    time: 284,
                    bluetoothClass: 7936
                }
            ];
            dataFactory.getPushBluetoothSensorData(req)
                .then(function () {
                    done(new Error('Factory did not throw!'));
                })
                .fail(function (error) {
                    done();
                });
        });
    })
});