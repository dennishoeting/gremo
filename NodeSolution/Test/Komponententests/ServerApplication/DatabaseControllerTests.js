/**
 * User: DennisHoeting
 * Date: 22.05.13
 * Time: 08:10
 *
 * $
 */

suite('Database Controller Tests', function () {
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

    var DBCtrl = require('./../../../ServerApplication/controllers/databaseCtrl.js').DatabaseControl;
    var databaseCtrl = new DBCtrl({
        pg: require('pg'),
        q: require('q'),
        logger: logger
    });

    var commonData = {
        email: 'mocha_test_client@gremo.de',
        password: 'somePass',
        code: 'someCode',
        communityType: 541,
        communityName: 'mocha_test_community',
        communityDescription: 'some lorem ipsum',
        actionType: 1,
        size: 10,
        routertype: 1,
        mac: '12:23:23:35:as'
    };

    test('connection test', function (done) {
        var connectionAccomplished = false;
        var res = databaseCtrl.connect({
            connectionString: 'tcp://postgres:gremo@alfsee.informatik.uni-oldenburg.de:50815/gremo'})
            .then(function () {
                connectionAccomplished = true;
                console.log('DatabaseControllerTests.js: jau 1');
                return databaseCtrl._customQuery('DELETE FROM gm_user WHERE email = $1', [commonData.email]);
            })
            .then(function () {
                console.log('DatabaseControllerTests.js: jau 2');
                return databaseCtrl._customQuery('DELETE FROM gm_pendingactivation WHERE code = $1', [commonData.code]);
            })
            .then(function () {
                console.log('DatabaseControllerTests.js: jau 3');
                assert.that(connectionAccomplished, is.true());
                return databaseCtrl._customQuery('DELETE FROM gm_community WHERE name = $1', [commonData.communityName]);
            })
            .then(function () {
                done();
            })
            .fail(function (error) {
                done(error);
            });
        assert.that(res.then, is.not.undefined());
    });

    function deleteUser(userid) {
        return databaseCtrl._customQuery('DELETE FROM gm_user WHERE id = $1', [userid]);
    }

    function deleteCommunity(communityid) {
        return databaseCtrl._customQuery('DELETE FROM gm_community WHERE id = $1', [communityid]);
    }

    function deleteAction(actionId) {
        return databaseCtrl._customQuery('DELETE FROM gm_action WHERE id = $1', [actionId]);
    }

    function registerUser(input) {
        input = input || {email: commonData.email, password: commonData.password, code: commonData.code};
        return databaseCtrl.register(input);
    }

    function getUserById(userId) {
        return databaseCtrl.getFullUser({userId: userId});
    }

    function activateUser(input) {
        input = input || {code: commonData.code};
        return databaseCtrl.activate(input);
    }

    function loginUser(input) {
        input = input || {login: commonData.email, password: commonData.password};
        return databaseCtrl.login(input);
    }

    function addCommunityWithoutFounder() {
        return databaseCtrl.addCommunity({typeId: commonData.communityType, name: commonData.communityName, description: commonData.communityDescription, requireconfirmation: false});
    }

    function addCommunityByFounderId(id) {
        return databaseCtrl.addCommunity({typeId: commonData.communityType, name: commonData.communityName, description: commonData.communityDescription, founderId: id, requireconfirmation: false});
    }

    function joinCommunity(userid, communityid) {
        return databaseCtrl.joinCommunity({userId: userid, communityId: communityid});
    }

    function getCommunityBinding(userid, communityid) {
        return databaseCtrl._customQuery('SELECT * FROM gm_community_user WHERE userid = $1 AND communityid = $2', [userid, communityid]);
    }

    function pushAction(userid) {
        return databaseCtrl.pushAction({typeId: commonData.actionType, userId: userid, mac: commonData.mac});
    }

    function endAction(userid) {
        return databaseCtrl.endAction({
            userId: userid
        })
    }

    function getAction(actionid) {
        return databaseCtrl._customQuery('SELECT * FROM gm_action WHERE id = $1', [actionid]);
    }

    function pushRandomGPSData(userid) {
        return databaseCtrl.pushGpsData([
            {
                userId: userid,
                speed: 25.1,
                timestamp: new Date(new Date().getTime()),
                position: 'POINT(8.53 35.8)',
                accuracy: 15.5,
                providerId: 2
            },
            {
                userId: userid,
                speed: 25.1,
                timestamp: new Date(new Date().getTime()+1000),
                position: 'POINT(8.530001 35.8)',
                accuracy: 15.5,
                providerId: 2
            }
        ])
    }

    function deleteWifirouter(wifirouterId) {
        return databaseCtrl._customQuery('DELETE FROM gm_wifirouter WHERE id = $1', [wifirouterId]);
    }

    function addWifiRouter(bssid, ssid) {
        return databaseCtrl.addWifiRouter({
            bssid: bssid,
            typeId: commonData.routertype,
            ssid: ssid,
            position: 'POINT(' + (8 + (Math.random())) + ' ' + (53 + (Math.random())) + ')',
            pointsperdetection: 5
        });
    }

    function pushWifiData(userid, wifiRouterIds, wifiRouterSSIDs) {
        return databaseCtrl.pushWifiData([
            {
                userId: userid,
                wifirouterBSSIDs: wifiRouterIds,
                wifirouterSSIDs: wifiRouterSSIDs,
                timestamp: new Date()
            }
        ]);
    }

    function addBluetoothSensor(sensorId) {
        return databaseCtrl.addBluetoothSensor({
            bssid: sensorId,
            timestamp: new Date(),
            position: 'POINT(' + (8 + (Math.random())) + ' ' + (53 + (Math.random())) + ')',
            typeId: 2,
            pointsperdetection: 5
        });
    }

    function deleteBluetoothSensor(sensorId) {
        return databaseCtrl._customQuery('DELETE FROM gm_bluetoothsensor WHERE id = $1', [sensorId]);
    }

    suite('getWifiRouterTypes', function () {
        test('Happy Path', function (done) {
            logger.info('getWifiRouterTypes TEST');
            databaseCtrl.getWifiRouterTypes()
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.rowCount, is.atLeast(1));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getBluetoothSensorTypes', function () {
        test('Happy Path', function (done) {
            logger.info('getBluetoothSensorTypes TEST');
            databaseCtrl.getBluetoothSensorTypes()
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.rowCount, is.atLeast(1));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('register', function () {
        var userId;
        teardown(function (done) {
            logger.info('register TEST');
            deleteUser(userId)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('register TEST');
            registerUser()
                .then(function (userid) {
                    userId = userid;
                    return getUserById(userid);
                })
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.id, is.equalTo(userId));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('activate', function () {
        var userid;
        setup(function (done) {
            logger.info('activate TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('activate TEST');
            deleteUser(userid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('activate TEST');
            activateUser()
                .then(function (result) {
                    assert.that(result, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('login', function () {
        var userid;
        setup(function (done) {
            logger.info('login TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('login TEST');
            deleteUser(userid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('User not activated', function (done) {
            logger.info('login TEST');
            loginUser()
                .then(function (user) {
                    assert.that(user.isactive, is.false());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('login TEST');
            activateUser()
                .then(function () {
                    return loginUser();
                })
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.id, is.not.NaN());
                    assert.that(result.email, is.not.undefined());
                    assert.that(result.password, is.not.undefined());
                    assert.that(result.isactive, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getLeaderboard', function () {
        test('HappyPath', function (done) {
            logger.info('getLeaderboard TEST');
            databaseCtrl.getLeaderboard({size: commonData.size})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.atMost(commonData.size));
                    assert.that(result.length, is.atLeast(1));
                    assert.that(result[0].id, is.not.undefined());
                    assert.that(result[0].email, is.not.undefined());
                    assert.that(result[0].points, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getMessages', function () {
        test('HappyPath', function (done) {
            logger.info('getMessages TEST');
            //TODO
            done();
        });
    });

    suite('markMessageAsRead', function () {
        test('HappyPath', function (done) {
            logger.info('markMessageAsRead TEST');
            //TODO
            done();
        });
    });

    suite('addCommunity', function () {
        var communityId, userid;

        setup(function (done) {
            logger.info('addCommunity TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('addCommunity TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteCommunity(communityId);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('addCommunity TEST');
            addCommunityByFounderId(userid)
                .then(function (result) {
                    assert.that(result, is.not.NaN());
                    communityId = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('joinCommunity', function () {
        var userid, communityFounderId, communityid;
        setup(function (done) {
            logger.info('joinCommunity TEST');
            registerUser({email: 'founder@gremo.de', password: commonData.password, code: 'foundSomecode'})
                .then(function (id) {
                    communityFounderId = id;
                    return addCommunityByFounderId(communityFounderId);
                })
                .then(function (result) {
                    console.log('DatabaseControllerTests.js: ##########################', result);
                    communityid = result;
                    return registerUser();
                })
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('joinCommunity TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteUser(communityFounderId);
                })
                .then(function () {
                    return deleteCommunity(communityid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('joinCommunity TEST');
            joinCommunity(userid, communityid)
                .then(function (result) {
                    assert.that(result, is.true());
                    return getCommunityBinding(userid, communityid);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    assert.that(result.rows[0].confirmed, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: closed community', function (done) {
            logger.info('joinCommunity TEST');
            databaseCtrl._customQuery('UPDATE gm_community SET requiresconfirmation = $1 WHERE id = $2', [true, communityid])
                .then(function (result) {
                    communityid2 = result.id;
                    return joinCommunity(userid, communityid);
                })
                .then(function (result) {
                    assert.that(result, is.false());
                    return getCommunityBinding(userid, communityid);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    assert.that(result.rows[0].confirmed, is.false());
                    return databaseCtrl._customQuery(
                        'SELECT * FROM gm_message WHERE reference = $1 AND receiverid = $2',
                        [result.rows[0].id, communityFounderId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    done();
                })
                .fail(function (error) {
                    console.log('DatabaseControllerTests.js: ', error);
                    done(error);
                });
        });
    });

    suite('leaveCommunity', function () {
        var userid, communityFounderId, communityid;
        setup(function (done) {
            logger.info('leaveCommunity TEST');
            registerUser({email: 'founder@gremo.de', password: commonData.password, code: 'foundSomecode'})
                .then(function (id) {
                    communityFounderId = id;
                    return addCommunityByFounderId(communityFounderId);
                })
                .then(function (result) {
                    communityid = result;
                    return registerUser();
                })
                .then(function (id) {
                    userid = id;
                    return joinCommunity(userid, communityid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('leaveCommunity TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteUser(communityFounderId);
                })
                .then(function () {
                    return deleteCommunity(communityid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('leaveCommunity TEST');
            databaseCtrl.leaveCommunity({userId: userid, communityId: communityid})
                .then(function (result) {
                    assert.that(result, is.true());
                    return getCommunityBinding(userid, communityid);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getUserCommunities', function () {
        var userid, communityFounderId, communityid;
        setup(function (done) {
            logger.info('getUserCommunities TEST');
            registerUser({email: 'founder@gremo.de', password: commonData.password, code: 'foundSomecode'})
                .then(function (id) {
                    communityFounderId = id;
                    return addCommunityByFounderId(communityFounderId);
                })
                .then(function (result) {
                    communityid = result;
                    return registerUser();
                })
                .then(function (id) {
                    userid = id;
                    return joinCommunity(userid, communityid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getUserCommunities TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteUser(communityFounderId);
                })
                .then(function () {
                    return deleteCommunity(communityid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('getUserCommunities TEST');
            databaseCtrl.getUserCommunities({userId: userid})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.equalTo(1));
                    assert.that(result[0].id, is.equalTo(communityid));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('pushAction', function () {
        var userid, actionid;
        setup(function (done) {
            logger.info('pushAction TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('pushAction TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteAction(actionid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('pushAction TEST');
            pushAction(userid)
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result, is.not.NaN());
                    actionid = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('endAction', function () {
        var userid, actionid;
        setup(function (done) {
            logger.info('endAction TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    return pushAction(userid);
                })
                .then(function (aid) {
                    actionid = aid;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('endAction TEST');
            deleteUser(userid)
                .then(function () {
                    deleteAction(actionid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path with no data', function (done) {
            logger.info('endAction TEST');
            endAction(userid)
                .then(function (result) {
                    assert.that(result.points, is.not.undefined());
                    assert.that(result.points, is.not.NaN());
                    return getAction(actionid);
                }).then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path with some data', function (done) {
            logger.info('endAction TEST');
            pushRandomGPSData(userid)
                .then(function () {
                    return endAction(userid);
                })
                .then(function (result) {
                    console.log('DatabaseControllerTests.js: ', result);
                    assert.that(result.points, is.not.undefined());
                    assert.that(result.points, is.not.NaN());
                    return getAction(actionid);
                }).then(function (result) {
                    assert.that(result.rowCount, is.equalTo(1));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('pushGpsData', function () {
        var userid, actionid;
        setup(function (done) {
            logger.info('pushGpsData TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    return pushAction(userid);
                })
                .then(function (result) {
                    actionid = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('pushGpsData TEST');
            deleteUser(userid)
                .then(function () {
                    deleteAction(actionid)
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('pushGpsData TEST');
            databaseCtrl.pushGpsData(
                    [
                        {userId: userid, speed: 25.1, timestamp: new Date(), position: 'POINT(' + (8 + (Math.random())) + ' ' + (53 + (Math.random())) + ')', accuracy: 15.5, providerId: 2},
                        {userId: userid, speed: 25.2, timestamp: new Date(new Date().getTime()+500), position: 'POINT(' + (8 + (Math.random())) + ' ' + (53 + (Math.random())) + ')', accuracy: 15.5, providerId: 2},
                        {userId: userid, speed: 25.3, timestamp: new Date(new Date().getTime()+1000), position: 'POINT(' + (8 + (Math.random())) + ' ' + (53 + (Math.random())) + ')', accuracy: 15.5, providerId: 2},
                        {userId: userid, speed: 25.5, timestamp: new Date(new Date().getTime()+1500), position: 'POINT(' + (8 + (Math.random())) + ' ' + (53 + (Math.random())) + ')', accuracy: 15.5, providerId: 2}
                    ])
                .then(function (result) {
                    assert.that(result, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('pushMotionData', function () {
        var userid, actionid;
        setup(function (done) {
            logger.info('pushMotionData TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    return pushAction(userid);
                })
                .then(function (result) {
                    actionid = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('pushMotionData TEST');
            deleteUser(userid)
                .then(function () {
                    deleteAction(actionid)
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('pushMotionData TEST');
            databaseCtrl.pushMotionData(
                    [
                        {
                            userId: userid,
                            timestamp: new Date(),
                            x: 1,
                            y: 2,
                            z: 3
                        }
                    ])
                .then(function (result) {
                    assert.that(result, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('addWifiRouter', function () {
        var wifiRouterId = '46:d3:d4:36;ds:r0';
        teardown(function (done) {
            logger.info('addWifiRouter TEST');
            deleteWifirouter(wifiRouterId)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: New Router', function (done) {
            logger.info('addWifiRouter TEST');
            addWifiRouter(wifiRouterId, 'New Mocha Wifi')
                .then(function (result) {
                    assert.that(result, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: Only Update', function (done) {
            logger.info('addWifiRouter TEST');
            addWifiRouter(wifiRouterId, 'New Mocha Wifi')
                .then(addWifiRouter.bind(this, wifiRouterId, 'New Mocha Wifi'))
                .then(function (result) {
                    assert.that(result, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('pushWifiData', function () {
        var wifiRouterIds = ['46:d3:d4:36;ds:r0', '46:d3:d4:36;ds:r1'];
        var wifiRouterSSIDs = ['myWifi1', 'myWifi2'];
        var actionid, userid;
        var ROUTER_TYPE = 1;

        setup(function (done) {
            logger.info('pushWifiData TEST');
            addWifiRouter(wifiRouterIds[0], 'New Mocha Wifi')
                .then(function () {
                    return registerUser();
                })
                .then(function (id) {
                    userid = id;
                    return pushAction(userid);
                })
                .then(function (result) {
                    actionid = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('pushWifiData TEST');
            deleteWifirouter(wifiRouterIds[0])
                .then(function () {
                    return deleteUser(userid);
                })
                .then(function () {
                    return deleteAction(actionid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('pushWifiData TEST');
            pushWifiData(userid, wifiRouterIds, wifiRouterSSIDs)
                .then(function (result) {
                    assert.that(result, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getWifiRouters', function () {
        var USER_ID;
        var ROUTER_TYPE = 1;
        var wifiRouterId = '46:d3:d4:36;ds:r0';
        setup(function (done) {
            logger.info('getWifiRouters TEST');
            addWifiRouter(wifiRouterId, 'New Mocha Wifi')
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });


        teardown(function (done) {
            logger.info('getWifiRouters TEST');
            deleteWifirouter(wifiRouterId)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('getWifiRouters TEST');
            databaseCtrl.getWifiRouters({limit: commonData.size, offset: 0})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getWifiRouters', function () {
        var USER_ID;
        var ROUTER_TYPE = 1;
        var wifiRouterId = '46:d3:d4:36;ds:r0';
        setup(function (done) {
            logger.info('getWifiRouters TEST');
            addWifiRouter(wifiRouterId, 'New Mocha Wifi')
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });


        teardown(function (done) {
            logger.info('getWifiRouters TEST');
            deleteWifirouter(wifiRouterId)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('getWifiRouters TEST');
            databaseCtrl.getWifiRouters({limit: 10, offset: 5})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.atMost(10));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('addBluetoothSensor', function () {
        var sensorid = '3h:53:kd:3d:t4:3d';

        teardown(function (done) {
            logger.info('addBluetoothSensor TEST');
            deleteBluetoothSensor(sensorid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: New', function (done) {
            logger.info('addBluetoothSensor TEST');
            addBluetoothSensor(sensorid)
                .then(function (result) {
                    assert.that(result, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: Update', function (done) {
            logger.info('addBluetoothSensor TEST');
            addBluetoothSensor(sensorid)
                .then(function () {
                    return addBluetoothSensor(sensorid);
                }).then(function (result) {
                    assert.that(result, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('pushBluetoothSensorData', function () {
        var sensorid = '3h:53:kd:3d:t4:3d';

        setup(function (done) {
            logger.info('pushBluetoothSensorData TEST');
            addBluetoothSensor(sensorid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('pushBluetoothSensorData TEST');
            deleteBluetoothSensor(sensorid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('pushBluetoothSensorData TEST');
            databaseCtrl.pushBluetoothSensorData([
                    {
                        bssid: sensorid,
                        actorIds: ['3d:2f:5g:6f:9k:2d', '3d:2f:5g:6f:9k:3d', '3d:2f:5g:6f:9k:4d'],
                        timestamps: [new Date(), new Date(), new Date()],
                        bluetoothClasses: [1234, 4523, 23634]
                    }
                ])
                .then(function (result) {
                    assert.that(result, is.true());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getActionList', function () {
        var userid, actionid;
        var LIMIT = 10;
        setup(function (done) {
            logger.info('getActionList TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    return pushAction(userid);
                })
                .then(function (result) {
                    actionid = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getActionList TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteAction(actionid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        /*
         * Running action is not shown!
         */
        test('Happy Path', function (done) {
            logger.info('getActionList TEST');
            databaseCtrl.getActionList({userId: userid, limit: LIMIT, offset: 0})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getActionDataLine', function () {
        var userid, actionid;
        setup(function (done) {
            logger.info('getActionDataLine TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    return pushAction(userid);
                })
                .then(function (result) {
                    actionid = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getActionDataLine TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteAction(actionid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: Without data', function (done) {
            logger.info('getActionDataLine TEST');
            assert.that(databaseCtrl.getActionDataLine.bind({actionid: actionid, userId: userid}), is.throwing());
            done();
        });

        test('Happy Path: With data', function (done) {
            logger.info('getActionDataLine TEST');
            pushRandomGPSData(userid)
                .then(function () {
                    assert.that(databaseCtrl.getActionDataLine.bind({actionid: actionid, userId: userid}), is.throwing());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getGPSDataForAction', function () {
        var userid, actionid;
        var LIMIT = 10;
        setup(function (done) {
            logger.info('getGPSDataForAction TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    return pushAction(userid);
                })
                .then(function (result) {
                    actionid = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getGPSDataForAction TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteAction(actionid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: Without data', function (done) {
            logger.info('getGPSDataForAction TEST');
            databaseCtrl.getGPSDataForAction({actionId: actionid, userId: userid})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: With data', function (done) {
            logger.info('getGPSDataForAction TEST');
            pushRandomGPSData(userid)
                .then(function () {
                    return databaseCtrl.getGPSDataForAction({actionId: actionid, userId: userid});
                })
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.equalTo(2));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getWifiRouterDetectionForAction', function () {
        var userid, actionid;
        var wifiRouterId = '46:d3:d4:36;ds:r0';
        var wifiRouterSSID = 'myWifi';
        setup(function (done) {
            logger.info('getWifiRouterDetectionForAction TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    return addWifiRouter(wifiRouterId, 'New Mocha Wifi');
                })
                .then(function () {
                    return pushAction(userid);
                })
                .then(function (result) {
                    actionid = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getWifiRouterDetectionForAction TEST');
            deleteWifirouter(wifiRouterId)
                .then(function () {
                    return deleteUser(userid);
                })
                .then(function () {
                    return deleteAction(actionid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: Without data', function (done) {
            logger.info('getWifiRouterDetectionForAction TEST');
            databaseCtrl.getWifiRouterDetectionForAction({actionId: actionid, userId: userid})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: With data', function (done) {
            logger.info('getWifiRouterDetectionForAction TEST');
            pushWifiData(userid, [wifiRouterId], [wifiRouterSSID])
                .then(function () {
                    return databaseCtrl.getWifiRouterDetectionForAction({actionId: actionid, userId: userid});
                })
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.equalTo(1));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getBluetoothSensorDetectionForAction', function () {
        var userid, actionid;
        var LIMIT = 10;
        var sensorid = '3h:53:kd:3d:t4:3d';

        setup(function (done) {
            logger.info('getBluetoothSensorDetectionForAction TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    return addBluetoothSensor(sensorid);
                })
                .then(function () {
                    return pushAction(userid);
                })
                .then(function (result) {
                    actionid = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getBluetoothSensorDetectionForAction TEST');
            deleteBluetoothSensor(sensorid)
                .then(function () {
                    return deleteUser(userid);
                })
                .then(function () {
                    return deleteAction(actionid);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: Without data', function (done) {
            logger.info('getBluetoothSensorDetectionForAction TEST');
            databaseCtrl.getBluetoothSensorDetectionForAction({actionId: actionid, userId: userid})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: With data', function (done) {
            logger.info('getBluetoothSensorDetectionForAction TEST');
            databaseCtrl.pushBluetoothSensorData([
                    {
                        bssid: sensorid,
                        actorIds: ['3d:2f:5g:6f:9k:2d', commonData.mac, '3d:2f:5g:6f:9k:4d'],
                        timestamps: [new Date(), new Date(), new Date()],
                        bluetoothClasses: [1234, 5125, 1263]
                    }
                ])
                .then(function () {
                    databaseCtrl._customQuery('SELECT * FROM gm_bluetoothsensordetection WHERE actionid = $1', [actionid])
                        .then(function (result) {
                            console.log('DatabaseControllerTests.js: ', result);
                            return;
                        })
                })
                .then(function () {
                    return databaseCtrl.getBluetoothSensorDetectionForAction({actionId: actionid, userId: userid});
                })
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.length, is.equalTo(1));
                    done();
                })
                .fail(function (error) {
                    console.log('DatabaseControllerTests.js: ', error);
                    done(error);
                });
        });
    });

    suite('getFullUser', function () {
        var userid;
        setup(function (done) {
            logger.info('getFullUser TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getFullUser TEST');
            deleteUser(userid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('getFullUser TEST');
            getUserById(userid)
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.id, is.equalTo(userid));
                    assert.that(result.email, is.equalTo(commonData.email));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getUserPoints', function () {
        var userid;
        setup(function (done) {
            logger.info('getUserPoints TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getUserPoints TEST');
            deleteUser(userid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('getUserPoints TEST');
            databaseCtrl.getUserPoints({userId: userid})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result.points, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('saveUser', function () {
        var userid;
        setup(function (done) {
            logger.info('saveUser TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('saveUser TEST');
            deleteUser(userid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: nickname', function (done) {
            logger.info('saveUser TEST');
            databaseCtrl.saveUser({nickname: 'somenickname', userId: userid})
                .then(function (result) {
                    assert.that(result, is.true());

                    return databaseCtrl.getFullUser({userId: userid});
                })
                .then(function (result) {
                    assert.that(result.nickname, is.equalTo('somenickname'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: firstname', function (done) {
            logger.info('saveUser TEST');
            databaseCtrl.saveUser({firstname: 'somefirstname', userId: userid})
                .then(function (result) {
                    assert.that(result, is.true());

                    return databaseCtrl.getFullUser({userId: userid});
                })
                .then(function (result) {
                    assert.that(result.firstname, is.equalTo('somefirstname'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: lastname', function (done) {
            logger.info('saveUser TEST');
            databaseCtrl.saveUser({lastname: 'somelastname', userId: userid})
                .then(function (result) {
                    assert.that(result, is.true());

                    return databaseCtrl.getFullUser({userId: userid});
                })
                .then(function (result) {
                    assert.that(result.lastname, is.equalTo('somelastname'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: birthyear', function (done) {
            logger.info('saveUser TEST');
            databaseCtrl.saveUser({birthyear: 1988, userId: userid})
                .then(function (result) {
                    assert.that(result, is.true());

                    return databaseCtrl.getFullUser({userId: userid});
                })
                .then(function (result) {
                    assert.that(result.birthyear, is.equalTo(1988));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: zipcode', function (done) {
            logger.info('saveUser TEST');
            databaseCtrl.saveUser({zipcode: 12345, userId: userid})
                .then(function (result) {
                    assert.that(result, is.true());

                    return databaseCtrl.getFullUser({userId: userid});
                })
                .then(function (result) {
                    assert.that(result.zipcode, is.equalTo(12345));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: postaddress', function (done) {
            logger.info('saveUser TEST');
            databaseCtrl.saveUser({postaddress: 'somepostaddress', userId: userid})
                .then(function (result) {
                    assert.that(result, is.true());

                    return databaseCtrl.getFullUser({userId: userid});
                })
                .then(function (result) {
                    assert.that(result.postaddress, is.equalTo('somepostaddress'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: nothing', function (done) {
            logger.info('saveUser TEST');
            databaseCtrl.saveUser({userId: userid})
                .then(function (result) {
                    done(new Error('Finished with result ', result));
                })
                .fail(function (error) {
                    assert.that(error.message, is.equalTo('No changes.'));
                    done();
                });
        });
        test('No data', function (done) {
            logger.info('saveUser TEST');
            databaseCtrl.saveUser({})
                .then(function (result) {
                    done(new Error('Finished with result ', result));
                })
                .fail(function (error) {
                    assert.that(error instanceof Error, is.true());
                    done();
                });
        });
    });

    suite('changePassword', function () {
        var userid;
        setup(function (done) {
            logger.info('changePassword TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('changePassword TEST');
            deleteUser(userid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('changePassword TEST');
            databaseCtrl.changePassword({userId: userid, pw1: 'newPass', oldPass: commonData.password})
                .then(function (result) {
                    assert.that(result, is.true());
                    return databaseCtrl.getFullUser({userId: userid});
                })
                .then(function (result) {
                    assert.that(result.password, is.equalTo('newPass'));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: Passwords dont match', function (done) {
            logger.info('changePassword TEST');
            databaseCtrl.changePassword({userId: userid, pw1: 'newPass', oldPass: 'falsePass'})
                .then(function (result) {
                    done(new Error('Finished with result ', result));
                })
                .fail(function (error) {
                    assert.that(error.message, is.equalTo('Old password incorrect.'));
                    return databaseCtrl.getFullUser({userId: userid})
                        .then(function (result) {
                            assert.that(result.password, is.equalTo(commonData.password));
                            done();
                        });
                });
        });

        test('No id', function (done) {
            logger.info('changePassword TEST');
            databaseCtrl.changePassword({pw1: 'newPass', oldPass: 'falsePass'})
                .then(function (result) {
                    done(new Error('Finished with result ', result));
                })
                .fail(function (error) {
                    assert.that(error instanceof Error, is.true());
                    return databaseCtrl.getFullUser({userId: userid})
                        .then(function (result) {
                            assert.that(result.password, is.equalTo(commonData.password));
                            done();
                        });
                });
        });
        test('No oldpass', function (done) {
            logger.info('changePassword TEST');
            databaseCtrl.changePassword({userId: userid, pw1: 'newPass'})
                .then(function (result) {
                    done(new Error('Finished with result ', result));
                })
                .fail(function (error) {
                    assert.that(error instanceof Error, is.true());
                    return databaseCtrl.getFullUser({userId: userid})
                        .then(function (result) {
                            assert.that(result.password, is.equalTo(commonData.password));
                            done();
                        });
                });
        });

        test('No pw1', function (done) {
            logger.info('changePassword TEST');
            databaseCtrl.changePassword({userId: userid, oldPass: 'falsePass'})
                .then(function (result) {
                    done(new Error('Finished with result ', result));
                })
                .fail(function (error) {
                    assert.that(error instanceof Error, is.true());
                    return databaseCtrl.getFullUser({userId: userid})
                        .then(function (result) {
                            assert.that(result.password, is.equalTo(commonData.password));
                            done();
                        });
                });
        });
    });

    suite('resetPassword', function () {
        var userid, pendingId;
        setup(function (done) {
            logger.info('resetPassword TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('resetPassword TEST');
            deleteUser(userid)
                .then(function () {
                    return databaseCtrl._customQuery('DELETE FROM gm_pendingpasswordreset WHERE id = $1', [pendingId]);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('resetPassword TEST');
            databaseCtrl.resetPassword({email: commonData.email, code: commonData.code, cryptPassword: 'cryptPass'})
                .then(function (result) {
                    assert.that(result, is.not.undefined());
                    assert.that(result, is.not.NaN());
                    return result;
                })
                .then(function (id) {
                    pendingId = id;
                    return databaseCtrl._customQuery('SELECT * FROM gm_pendingpasswordreset WHERE id = $1', [pendingId]);
                })
                .then(function (result) {
                    // There is an entry in gm_pendingpasswordreset
                    assert.that(result.rows[0].code, is.equalTo(commonData.code));
                    return databaseCtrl.getFullUser({userId: userid});
                })
                .then(function (result) {
                    // Password did NOT change yet
                    assert.that(result.password, is.equalTo(commonData.password));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('confirmPasswordReset', function () {
        var userid, pendingId;
        var NEW_PASS = 'cryptPass';
        setup(function (done) {
            logger.info('confirmPasswordReset TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    return databaseCtrl.resetPassword({email: commonData.email, code: commonData.code, cryptPassword: NEW_PASS});
                })
                .then(function (id) {
                    pendingId = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('confirmPasswordReset TEST');
            deleteUser(userid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('confirmPasswordReset TEST');
            databaseCtrl.confirmPasswordReset({code: commonData.code})
                .then(function (result) {
                    assert.that(result, is.true());
                    return databaseCtrl._customQuery('SELECT * FROM gm_pendingpasswordreset WHERE id = $1', [pendingId]);
                })
                .then(function (result) {
                    assert.that(result.rowCount, is.equalTo(0));
                    return databaseCtrl.getFullUser({userId: userid});
                })
                .then(function (result) {
                    assert.that(result.password, is.equalTo(NEW_PASS));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        })
    });

    suite('getAllUsers', function () {
        var userid;
        setup(function (done) {
            logger.info('getAllUsers TEST');
            registerUser()
                .then(function (id) {
                    userid = id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getAllUsers TEST');
            deleteUser(userid)
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('getAllUsers TEST');
            databaseCtrl.getAllUsers({limit: 5, offset: 0})
                .then(function (result) {
                    assert.that(result.length, is.atLeast(1));
                    assert.that(result.length, is.atMost(5));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('addCommunityType', function () {
        var COMMUNITY_NAME = 'mocha_community';
        var cId;

        teardown(function (done) {
            logger.info('addCommunityType TEST');
            databaseCtrl._customQuery('DELETE FROM gm_communitytype WHERE id = $1', [cId])
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('addCommunityType TEST');
            databaseCtrl.addCommunityType({name: COMMUNITY_NAME})
                .then(function (result) {
                    assert.that(result.name, is.equalTo(COMMUNITY_NAME));
                    cId = result.id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        })
    });

    suite('getCommunityTypes', function () {
        var COMMUNITY_NAME = 'mocha_community';
        var cId;

        setup(function (done) {
            logger.info('getCommunityTypes TEST');
            databaseCtrl.addCommunityType({name: COMMUNITY_NAME})
                .then(function (result) {
                    console.log('DatabaseControllerTests.js: ############################################### ', result);
                    cId = result.id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getCommunityTypes TEST');
            databaseCtrl._customQuery('DELETE FROM gm_communitytype WHERE id = $1', [cId])
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('getCommunityTypes TEST');
            databaseCtrl.getCommunityTypes({limit: 5, offset: 0})
                .then(function (result) {
                    assert.that(result.length, is.atLeast(1));
                    assert.that(result.length, is.atMost(5));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getAllCommunities', function () {
        var cId;
        var userid;
        setup(function (done) {
            logger.info('getAllCommunities TEST');
            registerUser()
                .then(function (result) {
                    userid = result;
                    return databaseCtrl.addCommunity({
                        typeId: commonData.communityType,
                        name: commonData.communityName,
                        description: commonData.communityDescription,
                        founderId: userid,
                        requireconfirmation: true});
                })
                .then(function (result) {
                    cId = result.id;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getAllCommunities TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteCommunity(cId);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path', function (done) {
            logger.info('getAllCommunities TEST');
            databaseCtrl.getAllCommunities({limit: 5, offset: 0})
                .then(function (result) {
                    assert.that(result.length, is.atLeast(1));
                    assert.that(result.length, is.atMost(5));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('getCommunityList', function () {
        var communityId;
        var userid;
        setup(function (done) {
            logger.info('getCommunityList TEST');
            registerUser()
                .then(function (result) {
                    userid = result;
                    return databaseCtrl.addCommunity({
                        typeId: commonData.communityType,
                        name: 'some community',
                        description: commonData.communityDescription,
                        founderId: userid,
                        requireconfirmation: true});
                })
                .then(function (result) {
                    communityId = result;
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        teardown(function (done) {
            logger.info('getCommunityList TEST');
            deleteUser(userid)
                .then(function () {
                    return deleteCommunity(communityId);
                })
                .then(function () {
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: successfull searchCommunity', function (done) {
            logger.info('getCommunityList TEST');
            databaseCtrl.getCommunityList({pattern: 'ome', limit: 5})
                .then(function (result) {
                    assert.that(result.length, is.atLeast(1));
                    assert.that(result.length, is.atMost(5));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });

        test('Happy Path: successfull searchCommunity', function (done) {
            logger.info('getCommunityList TEST');
            databaseCtrl.getCommunityList({pattern: 'knotenbrot_diesDarfNichtZuErfolgFuehren', limit: 5})
                .then(function (result) {
                    assert.that(result.length, is.equalTo(0));
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });

    suite('disconnect', function () {
        test('disconnect test', function (done) {
            logger.info('disconnect TEST');
            databaseCtrl.disconnect()
                .then(function (result) {
                    assert.that(result, is.true());
                    return databaseCtrl.disconnect();
                })
                .then(function (result) {
                    assert.that(result, is.false());
                    done();
                })
                .fail(function (error) {
                    done(error);
                });
        });
    });
});