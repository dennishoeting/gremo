/**
 * User: DennisHoeting
 * Date: 16.06.13
 * Time: 14:47
 *
 * $
 */


suite('Web Socket Controller Tests', function () {
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
    var _ = require('underscore');
    var socketioclient = require('socket.io-client');

    var standardPort = 4321;

    var standardHandler = function (data, callback) {
        callback(data);
    };

    var interfaces = ['login',
        'register',
        'openRegister',
        'getFullUser',
        'getUserFriends',
        'getUserFriend',
        'getFueltypes',
        'activate',
        'saveUser',
        'changePassword',
        'resetPassword',
        'confirmPasswordReset',
        'joinCommunity',
        'leaveCommunity',
        'acceptJoinRequest',
        'rejectJoinRequest',
        'getUserCommunities',
        'getCommunityList',
        'getUserList',
        'getCommunity',
        'getLeaderboard',
        'getGroupLeaderboard',
        'getMessages',
        'markMessageAsRead',
        'getActionList',
        'getActionData',
        'getWifiRouters',
        'getAllUsers',
        'addCommunityType',
        'getCommunityTypes',
        'addCommunity',
        'getAllCommunities',
        'calculateBluetoothTracks',
        'pushLockedZone',
        'getLockedZones',
        'deleteLockedZone',
        'alterLockedZone',
        'deleteData',
        'anonymizeData',
        'makeFriendRequest',
        'sendMessage',
        'uploadTrack',
        'deleteMessage',
        'deleteAccount',
        'donateTrack',
        'sendSweepstakeCredentials',
        'confirmNotification',
        'getInductionLoops',
        'getInductionLoopTypes',
        'createInductionLoop',
        'getBluetoothSensors',
        'uploadCSV',
        'calculateBluetoothRatio',
        'loadActions',
        'getInductionLoopGroups',
    'getMotionData'];

    var handler = {};
    for (var i = 0; i < interfaces.length; i++) {
        handler[interfaces[i]] = standardHandler;
    }

    var webSocketCtrl = new (require('./../../../ServerApplication/controllers/webSocketCtrl.js').WebSocketCtrl)({
        http: require('http'),
        socketIO: require('socket.io'),
        underscore: _,
        logger: logger,
        q: q,
        webSocketHandler: handler
    });

    test('Start', function (done) {
        webSocketCtrl.start({
            port: standardPort
        })
            .then(function () {
                var client = socketioclient.connect('localhost', {
                    port: standardPort
                });
                client.emit('login', 'test', function () {
                    done();
                });
            })
            .fail(function (error) {
                done(error);
            });
    });

    suite('Interfaces', function () {
        var client
        setup(function () {
            client = socketioclient.connect('localhost', {
                port: standardPort
            });
        });

        for (var i = 0; i < interfaces.length; i++) {
            var curr = interfaces[i];
            test(interfaces[i], function (done) {
                client.emit(curr, 'someData', function (data) {
                    assert.that(data, is.equalTo('someData'));
                    done();
                });
            });
        }
    });

    suite('Stop', function () {
        test('Happy Path', function (done) {
            client = socketioclient.connect('localhost', {
                port: standardPort
            });

            setTimeout(function () {
                client.disconnect();
                setTimeout(function () {
                    assert.that(client.emit.bind(this, 'something', function () {
                    }), is.throwing());
                    done();
                }, 50);
            }, 50);
        })
    });
});