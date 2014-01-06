/**
 * User: DennisHoeting
 * Date: 23.06.13
 * Time: 13:21
 *
 * $
 */

suite('Test HTTP Interfaces', function () {
    var assert = require('node-assertthat');
    var http = require('http');
    var log4js = require('log4js');
    log4js.configure({
        appenders: [
            {type: 'console'},
            {type: 'file', filename: 'logs/test.log', category: 'Test.js'}
        ]
    });
    var logger = log4js.getLogger('Test.js');
    logger.setLevel('INFO');
    var q = require('q');

    var port = 5001,
        wsPort = 5002,
        dbPort = 50815,
        dbHost = 'alfsee.informatik.uni-oldenburg.de',
        dbDBName = 'gremo',
        dbUsername = 'postgres',
        dbPassword = 'gremo';
    var serverApplication = new (require('./../../ServerApplication/serverApplication.js').ServerApplication)({
        dbConnection: ['tcp://', dbUsername, ':', dbPassword, '@', dbHost, ':', dbPort, '/', dbDBName].join(''),
        webSocketPort: wsPort,
        sensorPort: port});

    var deferredRequest = function (method, route, data) {
        var deferred = q.defer();

        console.log('HTTPInterfaceTests.js: Deferred Request: ', method, route, data);

        var options = {
                host: 'localhost',
                path: route,
                port: port,
                method: method
            },
            req;

        if (data) {
            if (typeof data == 'object') {
                data = JSON.stringify(data);
            } else if (typeof data != 'string') {
                deferred.reject('data must be string or object!');
            }

            options.headers = {
                "Content-Type": "application/json",
                "Content-Length": data.length // Often this part is optional
            };

            req = new http.ClientRequest(options);
            req.on('response', function (response) {
                response.on('data', function (chunk) {
                    deferred.resolve({statusCode: response.statusCode, data: JSON.parse(String(chunk))});
                });
                response.on('end', function () {
                    deferred.resolve({statusCode: response.statusCode, data: undefined});
                });
            });
            req.on('error', function (error) {
                deferred.reject(error);
            });
            req.end(data);
        } else {
            req = new http.ClientRequest(options);
            req.on('response', function (response) {
                response.on('data', function (chunk) {
                    deferred.resolve({statusCode: response.statusCode, data: JSON.parse(String(chunk))});
                });
                response.on('end', function () {
                    deferred.resolve({statusCode: response.statusCode, data: undefined});
                });
            });
            req.on('error', function (error) {
                deferred.reject(error);
            });
            req.end();
        }

        return deferred.promise;
    };

    var directDBCtrl = new (require('./../../ServerApplication/controllers/databaseCtrl.js').DatabaseControl)({
        pg: require('pg'),
        q: require('q'),
        logger: logger
    });

    var testUserId = undefined,
        testUserEmail = 'z@z.zz',
        testUserPassword = 'zpass';

    suite('Pretest: Insert user', function () {
        test('Insert or select testuser', function (done) {
            directDBCtrl.connect({connectionString: 'tcp://postgres:gremo@alfsee.informatik.uni-oldenburg.de:50815/gremo'})
                .then(function () {
                    return directDBCtrl._customQuery(
                        'SELECT id, isactive FROM gm_user WHERE email = $1',
                        [testUserEmail]);
                })
                .then(function (result) {
                    console.log('HTTPInterfaceTests.js: ', result);
                    if (result.rowCount < 1) {
                        return directDBCtrl._customQuery(
                            'INSERT INTO gm_user(email, password, membersince, isactive) VALUES ($1, $2, $3, $4) RETURNING id',
                            [testUserEmail, testUserPassword, new Date(), true]);
                    } else if (!result.rows[0].isactive) {
                        return directDBCtrl._customQuery(
                            'UPDATE gm_user SET isactive = $1 WHERE id = $2 RETURNING id',
                            [true, result.rows[0].id]);
                    } else {
                        return {rows: [
                            {id: result.rows[0].id}
                        ]};
                    }
                })
                .then(function (result) {
                    testUserId = result.rows[0].id;
                    console.log('HTTPInterfaceTests.js: ID IS', testUserId);
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('Start', function () {
        test('Should start', function (done) {
            serverApplication.start()
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('Interface /user', function () {
        test('Should return 202 and userId on Login', function (done) {
            deferredRequest('PUT', '/user', {
                username: testUserEmail,
                password: testUserPassword
            })
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(202));
                    assert.that(result.data, is.not.undefined());
                    assert.that(result.data.userId, is.equalTo(testUserId));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should return 401 on wrong login data', function (done) {
            deferredRequest('PUT', '/user', {
                username: testUserEmail,
                password: 'wrongPass'
            })
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(401));
                    assert.that(result.data, is.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should return points and 200 on GET request with userId', function (done) {
            deferredRequest('GET', '/user/' + testUserId + '/points')
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data.points, is.not.NaN());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should return 400 on wrong userId', function (done) {
            deferredRequest('GET', '/user/0/points')
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(400));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('Interface /action', function () {
        var actionType = 2,   // Bike
            mac = '42:f4:3f:hf:d0:d4',
            actionId = undefined;

        teardown(function (done) {
            directDBCtrl._customQuery('DELETE FROM gm_action WHERE id = $1', [actionId])
                // validate deletion
                .then(function () {
                    return directDBCtrl._customQuery('SELECT id FROM gm_action WHERE id = $1', [actionId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    return directDBCtrl._customQuery('SELECT id FROM gm_bluetoothsensordetection WHERE actionid = $1', [actionId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should return 204 and insert into gm_action and gm_runningaction on POST request', function (done) {
            // Insert action
            deferredRequest('POST', '/action/' + testUserId, {
                actionType: actionType,
                mac: mac
            })
                // Get inserted action
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                // Validate inserted action
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.rowCount, is.equalTo(1));
                    assert.that(result.rows[0], is.not.undefined());
                    assert.that(result.rows[0].id, is.not.NaN());
                    assert.that(result.rows[0].typeid, is.equalTo(actionType));
                    assert.that(Number(result.rows[0].distance), is.equalTo(0));
                    assert.that(Number(result.rows[0].points), is.equalTo(0));
                    assert.that(result.rows[0].line, is.null());
                    assert.that(result.rows[0].starttimestamp, is.null());
                    assert.that(result.rows[0].endtimestamp, is.null());
                    assert.that(result.rows[0].inserttimestamp, is.not.null());
                    assert.that(result.rows[0].inserttimestamp.getTime(), is.atLeast(new Date(new Date().getTime() - 1000 * 5).getTime()));

                    actionId = result.rows[0].id;

                    return directDBCtrl._customQuery('SELECT * FROM gm_runningaction WHERE actionid = $1', [actionId]);
                })
                // Validate inserted gm_bluetoothsensordetection
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.rowCount, is.equalTo(1));
                    assert.that(result.rows[0], is.not.undefined());
                    assert.that(result.rows[0].id, is.not.NaN());
                    assert.that(result.rows[0].actionid, is.equalTo(actionId));
                    assert.that(result.rows[0].identificationid, is.not.NaN());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should return 400 on wrong userId', function (done) {
            deferredRequest('POST', '/action/0', {
                actionType: actionType,
                mac: mac
            })
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(400));
                    assert.that(result.data, is.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should delete action if empty.', function (done) {
            // Insert action
            deferredRequest('POST', '/action/' + testUserId, {
                actionType: actionType,
                mac: mac
            })
                // Validate creation
                .then(function () {
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    actionId = result.rows[0].id;
                    return directDBCtrl._customQuery('SELECT * FROM gm_runningaction WHERE actionid = $1', [actionId]);
                })
                // End action (should delete action since it is empty)
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
                })
                // validate deletion
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data, is.not.undefined());
                    assert.that(result.data.pointsEarned, is.not.NaN());
                    assert.that(result.data.pointsEarned, is.equalTo(0));
                    return directDBCtrl._customQuery('SELECT id FROM gm_action WHERE id = $1', [actionId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    return directDBCtrl._customQuery('SELECT id FROM gm_bluetoothsensordetection WHERE actionid = $1', [actionId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should resolve action list', function (done) {
            var accuracy = 5.2,
                speed = 20.5;
            var action1, action2;

            // Insert action
            deferredRequest('POST', '/action/' + testUserId, {
                actionType: actionType,
                mac: mac
            })
                // Validate creation
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                // Validate creation and push gps
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    action1 = result.rows[0].id;
                    return deferredRequest('PUT', '/action/' + testUserId + '/gps', {
                        bulk: [
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime(),
                                lat: 53.2,
                                lng: 8.2,
                                providerId: 2
                            },
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime()+1000,
                                lat: 53.20000001,
                                lng: 8.2,
                                providerId: 2
                            } ,
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime()+2000,
                                lat: 53.20000002,
                                lng: 8.2,
                                providerId: 2
                            },
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime()+3000,
                                lat: 53.20000003,
                                lng: 8.2,
                                providerId: 2
                            }
                        ]
                    });
                })
                // Validate response and end action
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
                })
                // request action list (without limit or offset)
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data.pointsEarned, is.not.NaN());
                    return deferredRequest('GET', '/action/' + testUserId + '/list');
                })
                // validate and push another action
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data, is.not.undefined());
                    assert.that(result.data.list, is.not.undefined());
                    assert.that(result.data.list.length, is.atLeast(1));
                    assert.that(result.data.list.length, is.atMost(10));
                    assert.that(result.data.list[0], is.not.undefined());
                    assert.that(result.data.list[0].id, is.not.NaN());
                    assert.that(result.data.list[0].date, is.not.NaN());
                    assert.that(result.data.list[0].actionType, is.not.NaN());
                    assert.that(result.data.list[0].value, is.not.NaN());
                    return deferredRequest('POST', '/action/' + testUserId, {
                        actionType: actionType,
                        mac: mac
                    });
                })
                // Validate creation
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                // Validate creation and push gps
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    action2 = result.rows[0].id;
                    return deferredRequest('PUT', '/action/' + testUserId + '/gps', {
                        bulk: [
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime(),
                                lat: 53.4,
                                lng: 5.2,
                                providerId: 2
                            },
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime()+1000,
                                lat: 53.4,
                                lng: 5.20000001,
                                providerId: 2
                            },
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime()+2000,
                                lat: 53.4,
                                lng: 5.20000002,
                                providerId: 2
                            },
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime()+3000,
                                lat: 53.4,
                                lng: 5.20000003,
                                providerId: 2
                            }
                        ]
                    });
                })
                // Validate response and end action
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
                })
                // request action list (without limit 1)
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data.pointsEarned, is.not.NaN());

                    return deferredRequest('GET', '/action/' + testUserId + '/list?limit=1');
                })
                // getting action2
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data.list[0].id, is.equalTo(action2));
                    return deferredRequest('GET', '/action/' + testUserId + '/list?limit=1&offset=1');
                })
                // getting action1
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data.list[0].id, is.equalTo(action1));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should process GPS data (one data point) and delete action', function (done) {
            var accuracy = 5.2,
                speed = 20.5;

            // Insert action
            deferredRequest('POST', '/action/' + testUserId, {
                actionType: actionType,
                mac: mac
            })
                // Validate creation
                .then(function () {
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    actionId = result.rows[0].id;
                    return directDBCtrl._customQuery('SELECT * FROM gm_runningaction WHERE actionid = $1', [actionId]);
                })
                // Push GPS data
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    return deferredRequest('PUT', '/action/' + testUserId + '/gps', {
                        bulk: [
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime(),
                                lat: 53.4,
                                lng: 8.2,
                                providerId: 2
                            }
                        ]
                    });
                })
                // Validate response
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    assert.that(result.data, is.undefined());
                    return directDBCtrl._customQuery('SELECT * FROM gm_gpsdata WHERE actionid = $1', [actionId]);
                })
                // Validate gps entry and end action (should delete action since it has no length)
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    assert.that(result.rows[0], is.not.undefined());
                    assert.that(result.rows[0].id, is.not.NaN());
                    assert.that(result.rows[0].actionid, is.equalTo(actionId));
                    assert.that(result.rows[0].timestamp, is.not.null());
                    assert.that(result.rows[0].timestamp.getTime(), is.atLeast(new Date().getTime() - 1000 * 5));
                    assert.that(result.rows[0].position, is.not.null());
                    assert.that(Number(result.rows[0].accuracy), is.equalTo(accuracy));
                    assert.that(Number(result.rows[0].speed), is.equalTo(speed));
                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
                })
                // validate deletion
                .then(function () {
                    return directDBCtrl._customQuery('SELECT id FROM gm_action WHERE id = $1', [actionId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    return directDBCtrl._customQuery('SELECT id FROM gm_bluetoothsensordetection WHERE actionid = $1', [actionId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should process GPS data (two data points)', function (done) {
            var accuracy = 5.2,
                speed = 20.5;

            // Insert action
            deferredRequest('POST', '/action/' + testUserId, {
                actionType: actionType,
                mac: mac
            })
                // Validate creation
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    actionId = result.rows[0].id;
                    return directDBCtrl._customQuery('SELECT * FROM gm_runningaction WHERE actionid = $1', [actionId]);
                })
                // Push GPS data
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    return deferredRequest('PUT', '/action/' + testUserId + '/gps', {
                        bulk: [
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime(),
                                lat: 53.5,
                                lng: 8.2,
                                providerId: 2
                            },
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime()+1000,
                                lat: 53.50000001,
                                lng: 8.2,
                                providerId: 2
                            },
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime()+2000,
                                lat: 53.50000002,
                                lng: 8.2,
                                providerId: 2
                            },
                            {
                                speed: speed,
                                accuracy: accuracy,
                                time: new Date().getTime()+3000,
                                lat: 53.50000003,
                                lng: 8.2,
                                providerId: 2
                            }
                        ]
                    });
                })
                // Validate response and end action
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    assert.that(result.data, is.undefined());
                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
                })
                // validate action
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data, is.not.undefined());
                    assert.that(result.data.pointsEarned, is.not.NaN());
                    assert.that(result.data.pointsEarned, is.atLeast(1));
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = $1', [actionId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    assert.that(result.rows[0], is.not.undefined());
                    assert.that(result.rows[0].id, is.not.NaN());
                    assert.that(result.rows[0].typeid, is.equalTo(actionType));
                    assert.that(result.rows[0].userid, is.equalTo(testUserId));
                    assert.that(Number(result.rows[0].distance), is.atLeast(0.000000001));
                    assert.that(Number(result.rows[0].points), is.atLeast(1));
                    assert.that(result.rows[0].line, is.not.null());
                    assert.that(result.rows[0].starttimestamp.getTime(), is.atLeast(new Date().getTime() - 1000 * 10));
                    assert.that(result.rows[0].endtimestamp.getTime(), is.atLeast(new Date().getTime() - 1000 * 10));
                    assert.that(result.rows[0].inserttimestamp.getTime(), is.atLeast(new Date().getTime() - 1000 * 10));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

//        test('Should process Wifi data with known wifi sensor', function (done) {
//            var action;
//
//            // Insert action
//            deferredRequest('POST', '/action/' + testUserId, {
//                actionType: actionType,
//                mac: mac
//            })
//                // Validate creation
//                .then(function (result) {
//                    assert.that(result.statusCode, is.equalTo(204));
//                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
//                })
//                // Validate creation and push gps
//                .then(function (result) {
//                    assert.that(result.statusCode, is.equalTo(204));
//                    return deferredRequest('PUT', '/action/' + testUserId + '/wifi', {
//                        bulk: [
//                            {
//                                  wifirouterBSSIDs: [wifiId],
//                                  wifirouterSSIDs: [wifiId],
//                                time: wifiTimestampMillis
//                            }
//                        ]
//                    });
//                })
//                .then(function (result) {
//                    assert.that(result.statusCode, is.equalTo(204));
//                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
//                })
//                // Validate response and that router was created
//                .then(function (result) {
//                    assert.that(result.statusCode, is.equalTo(200));
//                    done();
//                })
//                .fail(function (error) {
//                    console.log('HTTPInterfaceTests.js: ', error);
//                    done(error);
//                });
//        });

        test('Should process Wifi data with unknown wifi sensor (no GPS)', function (done) {
            var action,
                wifiId = 'my_testWifiId1373823413965';

            // Insert action
            deferredRequest('POST', '/action/' + testUserId, {
                actionType: actionType,
                mac: mac
            })
                // Validate creation
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                // Validate creation and push gps
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    action = result.rows[0].id;
                    return deferredRequest('PUT', '/action/' + testUserId + '/wifi', {
                        bulk: [
                            {
                                wifirouterBSSIDs: [wifiId],
                                wifirouterSSIDs: [wifiId],
                                time: 1373823413965
                            }
                        ]
                    });
                })
                // Validate response and that there is an gm_iwifirouterupdate
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_wifirouterupdate WHERE bssid = $1', [wifiId]);
                })
                // Validate response and end action
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
                })
                // Validate response and that there is no gm_wifirouterupdate
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    return directDBCtrl._customQuery('SELECT * FROM gm_wifirouterupdate WHERE bssid = $1', [wifiId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    console.log('HTTPInterfaceTests.js: ', error);
                    done(error);
                });
        });

        test('Should process Wifi data with unknown wifi sensor (GPS before)', function (done) {
            var action,
                wifiTimestampMillis = new Date().getTime(),
                wifiId = 'my_testWifiId' + wifiTimestampMillis;

            // Insert action
            deferredRequest('POST', '/action/' + testUserId, {
                actionType: actionType,
                mac: mac
            })
                // Validate creation
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                // Push GPS before wifi
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    action = result.rows[0].id;
                    return deferredRequest('PUT', '/action/' + testUserId + '/gps', {
                        bulk: [
                            {
                                speed: 15.3,
                                accuracy: 12.5,
                                time: wifiTimestampMillis - 1000,
                                lat: 53.5,
                                lng: 8.3,
                                providerId: 2
                            },
                            {
                                speed: 15.3,
                                accuracy: 12.5,
                                time: wifiTimestampMillis - 2000,
                                lat: 53.50000001,
                                lng: 8.3,
                                providerId: 2
                            }
                        ]
                    });
                })
                // Validate creation and push gps
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return deferredRequest('PUT', '/action/' + testUserId + '/wifi', {
                        bulk: [
                            {
                                wifirouterBSSIDs: [wifiId],
                                wifirouterSSIDs: [wifiId],
                                time: wifiTimestampMillis
                            }
                        ]
                    });
                })
                // Validate response and end action
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
                })
                // Validate response and that router was created
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    return directDBCtrl._customQuery('SELECT ST_ASTEXT(position) FROM gm_wifirouterinstance WHERE routerid = $1',
                        [wifiId]);
                })
                // Validate response and delete router
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    assert.that(result.rows[0].st_astext, is.equalTo('POINT(' + 8.3 + ' ' + 53.5 + ')'))
                    return directDBCtrl._customQuery('DELETE FROM gm_wifirouter WHERE id = $1 RETURNING id', [wifiId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    done();
                })
                .fail(function (error) {
                    console.log('HTTPInterfaceTests.js: ', error);
                    done(error);
                });
        });

        test('Should process Wifi data with unknown wifi sensor (GPS after)', function (done) {
            var action,
                wifiTimestampMillis = new Date().getTime(),
                wifiId = 'my_testWifiId' + wifiTimestampMillis;

            // Insert action
            deferredRequest('POST', '/action/' + testUserId, {
                actionType: actionType,
                mac: mac
            })
                // Validate creation
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                // Validate creation and push gps
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    action = result.rows[0].id;
                    return deferredRequest('PUT', '/action/' + testUserId + '/wifi', {
                        bulk: [
                            {
                                wifirouterBSSIDs: [wifiId],
                                wifirouterSSIDs: [wifiId],
                                time: wifiTimestampMillis
                            }
                        ]
                    });
                })
                // Push GPS after Wifi
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return deferredRequest('PUT', '/action/' + testUserId + '/gps', {
                        bulk: [
                            {
                                speed: 15.3,
                                accuracy: 12.5,
                                time: wifiTimestampMillis + 1000,
                                lat: 53.5,
                                lng: 8.2,
                                providerId: 2
                            },
                            {
                                speed: 15.3,
                                accuracy: 12.5,
                                time: wifiTimestampMillis + 2000,
                                lat: 53.50000001,
                                lng: 8.2,
                                providerId: 2
                            }
                        ]
                    });
                })// Validate response and end action
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
                })
                // Validate response and that router was created
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    return directDBCtrl._customQuery('SELECT * FROM gm_wifirouterinstance WHERE routerid = $1',
                        [wifiId])
                })
                // Validate response and delete router
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    return directDBCtrl._customQuery('DELETE FROM gm_wifirouter WHERE id = $1 RETURNING id', [wifiId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    done();
                })
                .fail(function (error) {
                    console.log('HTTPInterfaceTests.js: ', error);
                    done(error);
                });
        });

        test('Should process Wifi data with unknown wifi sensor (GPS before and after)', function (done) {
            var action,
                wifiTimestampMillis = new Date().getTime(),
                wifiId = 'my_testWifiId' + wifiTimestampMillis;

            // Insert action
            deferredRequest('POST', '/action/' + testUserId, {
                actionType: actionType,
                mac: mac
            })
                // Validate creation
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_action WHERE id = (SELECT MAX(id) FROM gm_action WHERE userid = $1)', [testUserId]);
                })
                // Push GPS before wifi
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    action = result.rows[0].id;
                    return deferredRequest('PUT', '/action/' + testUserId + '/gps', {
                        bulk: [
                            {
                                speed: 15.3,
                                accuracy: 12.5,
                                time: wifiTimestampMillis - 1000,
                                lat: 53.5,
                                lng: 8.3,
                                providerId: 2
                            }
                        ]
                    });
                })
                // Validate creation and push gps
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return deferredRequest('PUT', '/action/' + testUserId + '/wifi', {
                        bulk: [
                            {
                                wifirouterBSSIDs: [wifiId],
                                wifirouterSSIDs: [wifiId],
                                time: wifiTimestampMillis
                            }
                        ]
                    });
                })
                // Push GPS after Wifi
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return deferredRequest('PUT', '/action/' + testUserId + '/gps', {
                        bulk: [
                            {
                                speed: 15.3,
                                accuracy: 12.5,
                                time: wifiTimestampMillis + 1000,
                                lat: 53.50000001,
                                lng: 8.3,
                                providerId: 2
                            }
                        ]
                    });
                })// Validate response and end action
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return deferredRequest('PUT', '/action/' + testUserId + '/end');
                })
                // Validate response and that router was created
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    return directDBCtrl._customQuery('SELECT * FROM gm_wifirouterinstance WHERE routerid = $1',
                        [wifiId])
                })
                // Validate response and delete router
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    return directDBCtrl._customQuery('DELETE FROM gm_wifirouter WHERE id = $1 RETURNING id', [wifiId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    done();
                })
                .fail(function (error) {
                    console.log('HTTPInterfaceTests.js: ', error);
                    done(error);
                });
        });

        //TODO: more action!
    });

    suite('Interface /bluetoothsensor', function () {
        var bssid,
            typeId = 1,
            pointsperdetection = 10,
            instanceId = undefined;

        teardown(function (done) {
            directDBCtrl._customQuery('DELETE FROM gm_bluetoothsensor WHERE id = $1', [bssid])
                .then(function () {
                    return directDBCtrl._customQuery('SELECT * FROM gm_bluetoothsensor WHERE id = $1', [bssid]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    return directDBCtrl._customQuery('DELETE FROM gm_bluetoothsensorinstance WHERE id = $1', [instanceId]);
                })
                .then(function () {
                    return directDBCtrl._customQuery('SELECT * FROM gm_bluetoothsensorinstance WHERE id = $1', [instanceId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should return 204 and insert into sensor and sensorinstance on POST request', function (done) {
            bssid = 'test1:' + String(new Date().getTime());
            deferredRequest('POST', '/bluetoothsensor', {
                bssid: bssid,
                typeId: typeId,
                lat: 52.9,
                lng: 8.63,
                pointsperdetection: pointsperdetection
            })
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    assert.that(result.data, is.undefined());
                    return directDBCtrl._customQuery('SELECT * FROM gm_bluetoothsensorinstance WHERE sensorid = $1', [bssid]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    assert.that(result.rows[0].id, is.not.NaN());
                    assert.that(result.rows[0].sensorid, is.equalTo(bssid));
                    assert.that(result.rows[0].position, is.not.null());
                    assert.that(result.rows[0].isactive, is.true());
                    assert.that(result.rows[0].pointsperdetection, is.equalTo(pointsperdetection));

                    instanceId = result.rows[0].id;

                    return directDBCtrl._customQuery('SELECT * FROM gm_bluetoothsensor WHERE id = $1', [bssid]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    assert.that(result.rows[0].id, is.equalTo(bssid));
                    assert.that(result.rows[0].typeid, is.equalTo(1));
                    assert.that(result.rows[0].lastheartbeat.getTime(), is.atLeast(new Date().getTime() - 5 * 1000));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should accept anonymous data', function (done) {
            bssid = 'test2:' + String(new Date().getTime());
            var scanResult = [
                {bluetoothId: '1:' + String(new Date().getTime()), time: new Date().getTime(), bluetoothClass: 7936},
                {bluetoothId: '2:' + String(new Date().getTime()), time: new Date().getTime(), bluetoothClass: 7936},
                {bluetoothId: '3:' + String(new Date().getTime()), time: new Date().getTime(), bluetoothClass: 7936},
                {bluetoothId: '4:' + String(new Date().getTime()), time: new Date().getTime(), bluetoothClass: 7936},
                {bluetoothId: '5:' + String(new Date().getTime()), time: new Date().getTime(), bluetoothClass: 7936}
            ];

            // Add sensor
            deferredRequest('POST', '/bluetoothsensor', {
                bssid: bssid,
                typeId: typeId,
                lat: 52.9,
                lng: 8.63,
                pointsperdetection: pointsperdetection
            })
                // Validate sensor
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_bluetoothsensorinstance WHERE sensorid = $1', [bssid]);
                })
                // Add data
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    instanceId = result.rows[0].id;

                    return deferredRequest('PUT', '/bluetoothsensor/' + bssid, {
                        bulk: [
                            {
                                scanResult: scanResult
                            }
                        ]
                    });
                })
                // Bluetoothdetection added
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data, is.undefined());
                    return directDBCtrl._customQuery('SELECT * FROM gm_bluetoothsensordetection WHERE sensorid = $1', [instanceId]);
                })
                // gm_bluetoothsensordetection added
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(scanResult.length));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Should accept empty data', function (done) {
            bssid = 'test3:' + String(new Date().getTime());
            var scanResult = [];

            // Add sensor
            deferredRequest('POST', '/bluetoothsensor', {
                bssid: bssid,
                typeId: typeId,
                lat: 52.9,
                lng: 8.63,
                pointsperdetection: pointsperdetection
            })
                // Validate sensor
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(204));
                    return directDBCtrl._customQuery('SELECT * FROM gm_bluetoothsensorinstance WHERE sensorid = $1', [bssid]);
                })
                // Add data
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    instanceId = result.rows[0].id;

                    return deferredRequest('PUT', '/bluetoothsensor/' + bssid, {
                        bulk: [
                            {
                                scanResult: scanResult
                            }
                        ]
                    });
                })
                // Bluetoothdetection added
                .then(function (result) {
                    assert.that(result.statusCode, is.equalTo(200));
                    assert.that(result.data, is.undefined());
                    return directDBCtrl._customQuery('SELECT * FROM gm_bluetoothsensordetection WHERE sensorid = $1', [instanceId]);
                })
                // gm_bluetoothsensordetection added
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('Stop', function () {
        test('Should stop', function (done) {
            console.log('HTTPInterfaceTests.js: deleting', testUserEmail);
            directDBCtrl._customQuery('DELETE FROM gm_action WHERE userid = $1', [testUserId])
                .then(function () {
                    return directDBCtrl._customQuery('DELETE FROM gm_user WHERE email = $1', [testUserEmail]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    console.log('HTTPInterfaceTests.js: stopping');
                    return serverApplication.stop();
                })
                .then(function () {
                    console.log('HTTPInterfaceTests.js: stopped');
                    done();
                })
                .fail(function (error) {
                    console.log('HTTPInterfaceTests.js: stopped (error)', error);
                    done(error);
                })
        });
    });
});