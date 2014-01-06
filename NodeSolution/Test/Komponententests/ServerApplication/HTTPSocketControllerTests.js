/**
 * User: DennisHoeting
 * Date: 16.06.13
 * Time: 14:47
 *
 * $
 */

suite('HTTP Socket Controller Tests', function () {
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
    var http = require('http');
    var q = require('q');
    var _ = require('underscore');

    var standardHandler = function (urlEnd, req, res) {
        console.log('HTTPSocketControllerTests.js: ', req.params);

        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
        });
        res.write(urlEnd);
        res.end();
    };

    var promisedRequest = function (options, payload) {
        var deferred = q.defer();

        var result = {
                invokedHandler: '',
                code: -1
            },
            req;

        if (payload == undefined) {
            req = new http.ClientRequest(options);
            req.on('response', function (response) {
                result.code = response.statusCode;
                response.on('data', function (chunk) {
                    result.invokedHandler += chunk;
                });
                response.on('end', function () {
                    deferred.resolve(result);
                });
            });
            req.end();
        } else {
            options.headers = {
                "Content-Type": "application/json",
                "Content-Length": payload.length // Often this part is optional
            };
            req = new http.ClientRequest(options);
            req.on('response', function (response) {
                result.code = response.statusCode;
                response.on('data', function (chunk) {
                    result.invokedHandler += chunk;
                });

                response.on('end', function () {
                    deferred.resolve(result);
                })
            });
            req.write(payload);
            req.end();
        }

        return deferred.promise;
    };

    var httpCtrl = new (require('./../../../ServerApplication/controllers/httpSocketCtrl.js').HTTPSocketCtrl)({
        http: http,
        express: require('express'),
        logger: logger,
        q: q,
        httpSocketHandler: {
            processLogin: standardHandler.bind(undefined, 'processLogin'),
            processStartAction: standardHandler.bind(undefined, 'processStartAction'),
            processStopAction: standardHandler.bind(undefined, 'processStopAction'),
            processGPSData: standardHandler.bind(undefined, 'processGPSData'),
            processWIFIData: standardHandler.bind(undefined, 'processWIFIData'),
            processBluetoothData: standardHandler.bind(undefined, 'processBluetoothData'),
            processMotionData: standardHandler.bind(undefined, 'processMotionData'),
            processPointRequest: standardHandler.bind(undefined, 'processPointRequest'),
            processGetActionList: standardHandler.bind(undefined, 'processGetActionList'),
            processAddWifi: standardHandler.bind(undefined, 'processAddWifi'),
            processAddBluetooth: standardHandler.bind(undefined, 'processAddBluetooth'),
            processBluetoothSensorData: standardHandler.bind(undefined, 'processBluetoothSensorData'),
            options: standardHandler.bind(undefined, 'options'),
            fallback: standardHandler.bind(undefined, 'fallback')
        }
    });

    var standardPort = 3015;

    var startParameters = {
        port: standardPort
    };

    var httpRequestOptions = {
        host: 'localhost',
        path: '/',
        port: standardPort,
        method: 'POST'
    };

    suite('Start', function () {
        test('with insufficient start parameter', function (done) {
            httpCtrl.start(undefined)
                .then(function () {
                    done(new Error('Start successfull although start parameters are insufficient!'));
                })
                .fail(function (error) {
                    assert.that(error, is.not.undefined());
                    done();
                });
        });

        test('with insufficient start parameter, port is NaN', function (done) {
            httpCtrl.start({port: 'Hundekuchen'})
                .then(function () {
                    done(new Error('Start successfull although start parameters are insufficient!'));
                })
                .fail(function (error) {
                    assert.that(error, is.not.undefined());
                    done();
                });
        });

        test('Happy Path', function (done) {
            httpCtrl.start(startParameters)
                .then(function () {
                    return promisedRequest(httpRequestOptions);
                })
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('fallback'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('Test interface /user', function () {
        test('PUT on /user will call processLogin', function (done) {
            httpRequestOptions.method = 'PUT';
            httpRequestOptions.path = '/user';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('processLogin'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('GET on /user will call processPointRequest', function (done) {
            httpRequestOptions.method = 'GET';
            httpRequestOptions.path = '/user/1234/points';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('processPointRequest'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('OPTIONS on /user will call options', function (done) {
            httpRequestOptions.method = 'OPTIONS';
            httpRequestOptions.path = '/user';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('options'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        _.each(['POST', 'DELETE'], function (method) {
            test(method + ' on /user will call fallback', function (done) {
                httpRequestOptions.method = method;
                httpRequestOptions.path = '/user';
                promisedRequest(httpRequestOptions)
                    .then(function (result) {
                        assert.that(result.code, is.equalTo(200));
                        assert.that(result.invokedHandler, is.equalTo('fallback'));
                        done();
                    })
                    .fail(function (error) {
                        done(error);
                    });
            });
        });
    });

    suite('Test interface /action', function () {
        test('POST on /action will call processStartAction', function (done) {
            httpRequestOptions.method = 'POST';
            httpRequestOptions.path = '/action/1234';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('processStartAction'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('PUT on /action/:userId/gps will call processGPSData', function (done) {
            httpRequestOptions.method = 'PUT';
            httpRequestOptions.path = '/action/1234/gps';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('processGPSData'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('PUT on /action/:userId/wifi will call processWIFIData', function (done) {
            httpRequestOptions.method = 'PUT';
            httpRequestOptions.path = '/action/1234/wifi';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('processWIFIData'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });


        test('PUT on /action without userid will call fallback', function (done) {
            httpRequestOptions.method = 'PUT';
            httpRequestOptions.path = '/action';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('fallback'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('PUT on /action/:userId/end will call processStopAction', function (done) {
            httpRequestOptions.method = 'PUT';
            httpRequestOptions.path = '/action/1234/end';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('processStopAction'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('OPTIONS on /action will call options', function (done) {
            httpRequestOptions.method = 'OPTIONS';
            httpRequestOptions.path = '/action';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('options'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        _.each(['GET', 'DELETE'], function (method) {
            test(method + ' on /action will call fallback', function (done) {
                httpRequestOptions.method = method;
                httpRequestOptions.path = '/action';
                promisedRequest(httpRequestOptions)
                    .then(function (result) {
                        assert.that(result.code, is.equalTo(200));
                        assert.that(result.invokedHandler, is.equalTo('fallback'));
                        done();
                    })
                    .fail(function (error) {
                        done(error);
                    });
            });
        });
    });

    suite('Test interface /wifisensor', function () {
        test('POST on /wifisensor will call processAddWifi', function (done) {
            httpRequestOptions.method = 'POST';
            httpRequestOptions.path = '/wifisensor';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('processAddWifi'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('OPTIONS on /wifisensor will call options', function (done) {
            httpRequestOptions.method = 'OPTIONS';
            httpRequestOptions.path = '/wifisensor';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('options'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        _.each(['GET', 'PUT', 'DELETE'], function (method) {
            test(method + ' on /wifisensor will call fallback', function (done) {
                httpRequestOptions.method = method;
                httpRequestOptions.path = '/wifisensor';
                promisedRequest(httpRequestOptions)
                    .then(function (result) {
                        assert.that(result.code, is.equalTo(200));
                        assert.that(result.invokedHandler, is.equalTo('fallback'));
                        done();
                    })
                    .fail(function (error) {
                        done(error);
                    });
            });
        });
    });

    suite('Test interface /bluetoothsensor', function () {
        test('POST on /bluetoothsensor will call processAddBluetooth', function (done) {
            httpRequestOptions.method = 'POST';
            httpRequestOptions.path = '/bluetoothsensor';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('processAddBluetooth'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('PUT on /bluetoothsensor will call processAddBluetooth', function (done) {
            httpRequestOptions.method = 'PUT';
            httpRequestOptions.path = '/bluetoothsensor/1234';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('processBluetoothSensorData'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('PUT on /bluetoothsensor without mac will call fallback', function (done) {
            httpRequestOptions.method = 'PUT';
            httpRequestOptions.path = '/bluetoothsensor';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('fallback'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('OPTIONS on /bluetoothsensor will call options', function (done) {
            httpRequestOptions.method = 'OPTIONS';
            httpRequestOptions.path = '/bluetoothsensor';
            promisedRequest(httpRequestOptions)
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('options'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        _.each(['GET', 'DELETE'], function (method) {
            test(method + ' on /bluetoothsensor will call fallback', function (done) {
                httpRequestOptions.method = method;
                httpRequestOptions.path = '/bluetoothsensor';
                promisedRequest(httpRequestOptions)
                    .then(function (result) {
                        assert.that(result.code, is.equalTo(200));
                        assert.that(result.invokedHandler, is.equalTo('fallback'));
                        done();
                    })
                    .fail(function (error) {
                        done(error);
                    });
            });
        });
    });

    suite('Stop', function () {
        test('Happy Path', function (done) {
            //skip this
            return done();

            httpCtrl.stop()
                .then(function () {
                    assert.that(promisedRequest.bind(this, httpRequestOptions), is.throwing());
                    done();
                })
                .then(function () {
                    done(new Error('Server not stopped'));
                })
                .fail(function () {
                    done();
                })
        });

        test('Reconnect', function (done) {
            //skip this
            return done();

            httpCtrl.start(startParameters)
                .then(function () {
                    return httpCtrl.stop();
                })
                .then(function () {
                    return httpCtrl.start(startParameters);
                })
                .then(function () {
                    return promisedRequest(httpRequestOptions);
                })
                .then(function (result) {
                    assert.that(result.code, is.equalTo(200));
                    assert.that(result.invokedHandler, is.equalTo('fallback'));
                    return httpCtrl.stop();
                })
                .then(function () {
                    assert.that(promisedRequest.bind(this, httpRequestOptions), is.throwing());
                    done();
                })
                .then(function () {
                    done(new Error('Server not stopped'));
                })
                .fail(function () {
                    done();
                });
        });
    });
});