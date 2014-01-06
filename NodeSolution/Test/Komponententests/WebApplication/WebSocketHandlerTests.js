/**
 * User: DennisHoeting
 * Date: 15.05.13
 * Time: 19:33
 *
 * $
 */
suite('Web Socket Handler Tests', function () {
    var assert = require('node-assertthat');
    var log4js = require('log4js');
    log4js.configure({
        appenders: [
            {type: 'console'},
            {type: 'file', filename: 'logs/test.log', category: 'Test.js'}
        ]
    });
    var logger = log4js.getLogger('Test.js');
    logger.setLevel('INFO');

    var socket;
    var WSH = require('./../../../WebApplication/handlers/webSocketHdl.js').WebSocketHandler;
    var webSocketHandler;

    setup(function () {
        socket = {};
        webSocketHandler = new WSH({
            webSocketClient: {
                emit: function (code, data, callback) {
                    callback(code, data);
                }
            },
            clients: {
                0: {
                    userid: 0,
                    usertype: 0
                },
                1: {
                    userid: 1,
                    usertype: 1
                }
            },
            clientCodesPerId: {},
            clientCodesPerCode: {},
            smtpCtrl: {},
            cryptCtrl: {},
            logger: logger
        });
    });

    suite('identification', function () {
        test('Happy Path', function (done) {
            var newId = 1, newType = 1;
            webSocketHandler.identification(socket, {userId: newId, userType: newType}, function (result) {
                assert.that(result, is.true());
                assert.that(socket.userId, is.not.undefined());
                assert.that(socket.userId, is.not.NaN());
                assert.that(socket.userType, is.not.undefined());
                assert.that(socket.userType, is.equalTo(newType));
                done();
            });
        });

        test('negative', function (done) {
            var newType = 1;
            webSocketHandler.identification(socket, {userId: undefined, userType: newType}, function (result) {
                assert.that(result, is.true());
                assert.that(socket.userId, is.not.undefined());
                assert.that(socket.userId, is.not.NaN());
                assert.that(socket.userType, is.not.undefined());
                assert.that(socket.userType, is.equalTo(newType));
                done();
            });
        });

        test('negative2', function (done) {
            var newId = 5;
            webSocketHandler.identification(socket, {userId: newId, type: undefined}, function (result) {
                assert.that(result, is.true());
                assert.that(socket.userId, is.not.undefined());
                assert.that(socket.userId, is.not.NaN());
                assert.that(socket.userType, is.not.undefined());
                assert.that(socket.userType, is.equalTo('unknown'));
                done();
            });
        });
    });

    suite('getFullUser', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.getFullUser(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getFullUser'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });
    });

    suite('saveUser', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.saveUser(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('saveUser'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });
    });

    suite('changePassword', function () {
        test('Happy Path', function (done) {
            var data = {
                pw1: 'test',
                pw2: 'test'
            };
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.changePassword(socket, data, function (event, data) {
                assert.that(event, is.equalTo('changePassword'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });

        test('Passwords don\'t match', function (done) {
            var data = {
                pw1: 'test',
                pw2: 'test2'
            };
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.changePassword(socket, data, function (err) {
                assert.that(err instanceof Error, is.true());
                assert.that(err.message, is.equalTo('Passwords don\'t match.'));
                done();
            });
        });
    });


    suite('getActionList', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.getActionList(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getActionList'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });

    });

    suite('getActionData', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.getActionData(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getActionData'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });
    })

    suite('getLeaderboard', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.getLeaderboard(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getLeaderboard'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });
    });

    suite('getMessages', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.getMessages(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getMessages'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });
    });

    suite('markMessageAsRead', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random()*100);
            webSocketHandler.markMessageAsRead(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('markMessageAsRead'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });

        });
    });

    suite('joinCommunity', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.joinCommunity(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('joinCommunity'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });
    });

    suite('acceptJoinRequest', function () {
        // TODO
    });

    suite('rejectJoinRequest', function () {
        //TODO
    });

    suite('getCommunity', function () {
        //TODO
    })

    suite('leaveCommunity', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.leaveCommunity(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('leaveCommunity'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });
    });

    suite('getUserCommunities', function () {
        test('Happy Path', function (done) {
            socket.userId = Math.floor(Math.random() * 100);
            webSocketHandler.getUserCommunities(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getUserCommunities'));
                assert.that(data.userId, is.equalTo(socket.userId));
                done();
            });
        });
    });

    suite('getCommunityList', function () {
        test('Happy Path', function (done) {
            webSocketHandler.getCommunityList(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getCommunityList'));
                done();
            });
        });
    });

    /*
    suite('addCommunityType', function () {
        test('Happy Path', function (done) {
            webSocketHandler.addCommunityType(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('addCommunityType'));
                done();
            });
        });
    });

    suite('getAllCommunityTypes', function () {
        test('Happy Path', function (done) {
            webSocketHandler.getAllCommunityTypes(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getAllCommunityTypes'));
                done();
            });
        });
    });

    suite('addCommunity', function () {
        test('Happy Path', function (done) {
            webSocketHandler.addCommunity(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('addCommunity'));
                done();
            });
        });
    });

    suite('getAllCommunities', function () {
        test('Happy Path', function (done) {
            webSocketHandler.getAllCommunities(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getAllCommunities'));
                done();
            });
        });
    });

    suite('getOnlineUsers', function () {
        test('Happy Path', function (done) {
            webSocketHandler.getOnlineUsers(socket, {}, function (err, result) {
                assert.that(err, is.undefined());
                assert.that(result.length, is.equalTo(2))
                done();
            });
        });
    });

    suite('getAllUsers', function () {
        test('Happy Path', function (done) {
            webSocketHandler.getAllUsers(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('getAllUsers'));
                done();
            });
        });
    });

    suite('saveWifiRouter', function () {
        test('Happy Path', function (done) {
            webSocketHandler.saveWifiRouter(socket, {}, function (event, data) {
                assert.that(event, is.equalTo('saveWifiRouter'));
                done();
            });
        });
    });
    */
});