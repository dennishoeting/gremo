/**
 * User: DennisHoeting
 * Date: 24.05.13
 * Time: 09:36
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
    var logger = log4js.getLogger('Test.js')
    logger.setLevel('INFO');
    var q = require('q');

    var WSH = require('./../../../ServerApplication/handlers/webSocketHdl.js').WSHandler;
    var webSocketHandler = undefined;

    var rightPw = 'rightPW';
    var USERID = 5;

    var standardPromise = function () {
        var deferred = q.defer();
        if (current.databaseRunning) {
            deferred.resolve(true);
        } else {
            deferred.reject(new Error('Database not running'));
        }
        return deferred.promise;
    };


    var databaseMock = {
        register: standardPromise,
        openRegister: standardPromise,
        login: function (data) {
            var deferred = q.defer();
            if (current.databaseRunning) {
                deferred.resolve({isactive: true});
            } else {
                deferred.reject(new Error('Database not running'));
            }
            return deferred.promise;
        },
        activate: standardPromise,
        getFullUser: function (data) {
            var deferred = q.defer();
            var result = (data.id == USERID);
            if (current.databaseRunning) {
                deferred.resolve(result);
            } else {
                deferred.reject(new Error('Database not running'));
            }
            return deferred.promise;
        },
        saveUser: standardPromise,
        changePassword: standardPromise,
        resetPassword: standardPromise,
        confirmPasswordReset: standardPromise,
        getLeaderboard: standardPromise,
        getGroupLeaderboard: standardPromise,
        getMessages: standardPromise,
        markMessageAsRead: standardPromise,
        joinCommunity: standardPromise,
        leaveCommunity: standardPromise,
        getUserCommunities: standardPromise,
        getCommunityList: standardPromise,
        getActionList: standardPromise,
        getActionData: standardPromise,
        getActionDataLine: standardPromise,
        getGPSDataForAction: standardPromise,
        getWifiRouterDetectionForAction: standardPromise,
        getBluetoothSensorDetectionForAction: standardPromise,
        getMotionDataForAction: standardPromise,
        getAllUsers: standardPromise,
        getWifiRouters: standardPromise,
        getWifiRoutersSimple: standardPromise,
        saveWifiRouter: standardPromise,
        addCommunityType: standardPromise,
        getCommunityTypes: standardPromise,
        addCommunity: standardPromise,
        getAllCommunities: standardPromise,
        deleteAccount: standardPromise,
        pushLockedZone: standardPromise,
        getCommunity: standardPromise,
        getUserList: standardPromise,
        getFueltypes: standardPromise,
        getUserFriend: standardPromise,
        deleteLockedZone: standardPromise,
        getLockedZone: standardPromise,
        deleteData: standardPromise,
        alterLockedZone: standardPromise,
        anonymizeData: standardPromise,
        makeFriendRequest: standardPromise,
        sendMessage: standardPromise,
        deleteMessage: standardPromise,
        getInductionLoops: standardPromise,
        confirmNotification: standardPromise,
        createInductionLoop: standardPromise,
        getBluetoothSensors: standardPromise,
        calculateBluetoothRatio: standardPromise,
        loadActions: standardPromise,
        calculateBluetoothTracks: standardPromise,
        getUserFriends: standardPromise,
        acceptJoinRequest: standardPromise,
        rejectJoinRequest: standardPromise,
        getCommunityMembers: standardPromise,
        getLockedZones: standardPromise,
        uploadCSV: standardPromise,
        getMotionData: standardPromise,
        getInductionLoopTypes: standardPromise,
        getInductionLoopGroups: standardPromise,
        insertSweepstakeCredentials: standardPromise
    };

    var standardFactoryPromise = function () {
        var deferred = q.defer();
        console.log('WebSocketHandlerTests.js: ######################### STAMDARD');
        deferred.resolve({data: 'some'});
        return deferred.promise;
    };
    var dataFactoryMock = {
        validateLoginData: standardFactoryPromise,
        validateRegistrationData: standardFactoryPromise,
        validateOpenRegistrationData: standardFactoryPromise
    };

    var current = undefined;

    var data;

    setup(function () {
        webSocketHandler = new WSH({
            databaseCtrl: databaseMock,
            logger: logger,
            dataFactory: dataFactoryMock
        });

        current = {
            databaseRunning: true
        }
    });

    suite('login', function () {
        setup(function () {
            data = {
                username: 'someUser',
                password: rightPw
            };
        });

        test('Happy Path', function (done) {
            webSocketHandler.login(data, function (err, result) {
                assert.that(err instanceof Error, is.false());
                assert.that(result, is.not.undefined());
                done();
            });
        });


        test('Wrong Password', function (done) {
            data.password = 'someFalsePass';
            webSocketHandler.login(data, function (err, result) {
                assert.that(err instanceof Error, is.true());

                done();
            });
        });

        test('Database not running', function (done) {
            current.databaseRunning = false;
            webSocketHandler.login(data, function (err, result) {
                assert.that(err instanceof Error, is.true());

                done();
            });
        });

        test('negative', function (done) {
            data.username = undefined;
            webSocketHandler.login(data, function (err) {
                assert.that(err instanceof Error, is.true());
                done();
            });
        });

        test('negative2', function (done) {
            data.password = undefined;
            webSocketHandler.login(data, function (err) {
                assert.that(err instanceof Error, is.true());
                done();
            });
        });
    });

    suite('getFullUser', function () {
        setup(function () {
            data = {
                id: USERID
            };
        });
        test('Happy Path', function (done) {
            webSocketHandler.getFullUser(data, function (err, result) {
                assert.that(err instanceof Error, is.is.false());
                assert.that(result, is.is.true());
                done();
            });
        });

        test('Database not running', function (done) {
            current.databaseRunning = false;
            webSocketHandler.getFullUser(data, function (err) {
                assert.that(err instanceof Error, is.is.true());
                done();
            });
        });
    });


    var interfaces = [
        'register',
        'openRegister',
        'getFueltypes',
        'activate',
        'getUserFriends',
        'getUserFriend',
        'saveUser',
        'changePassword',
        'resetPassword',
        'confirmPasswordReset',
        'getLeaderboard',
        'getGroupLeaderboard',
        'getMessages',
        'markMessageAsRead',
        'joinCommunity',
        'leaveCommunity',
        'acceptJoinRequest',
        'rejectJoinRequest',
        'getUserCommunities',
        'getCommunityList',
        'getUserList',
        'getCommunity',
        'getActionList',
        'getAllUsers',
        'getWifiRouters',
        'addCommunityType',
        'getCommunityTypes',
        'addCommunity',
        'getAllCommunities',
        'pushLockedZone',
        'getLockedZones',
        'deleteLockedZone',
        'alterLockedZone',
        'deleteData',
        'anonymizeData',
        'makeFriendRequest',
        'sendMessage',
        'deleteMessage',
        'deleteAccount',
        'sendSweepstakeCredentials',
        'confirmNotification',
        'getInductionLoops',
        'getInductionLoopTypes',
        'getInductionLoopGroups',
        'createInductionLoop',
        'getBluetoothSensors',
        'calculateBluetoothRatio',
        'loadActions',
        'calculateBluetoothTracks',
        'getMotionData'];
    for (var i = 0; i < interfaces.length; i++) {
        var curr = interfaces[i];
        suite(curr, function () {
            var innerCurr = curr;
            setup(function () {
                data = {};
            });
            test('Happy Path', function (done) {
                console.log('WebSocketHandlerTests.js: innercurr is ', innerCurr);
                webSocketHandler[innerCurr].call(undefined, data, function (err, result) {
                    assert.that(err instanceof Error, is.false());
                    assert.that(result, is.true());
                    done();
                });
            });

            test('Database not running', function (done) {
                current.databaseRunning = false;
                webSocketHandler[innerCurr].call(undefined, data, function (err) {
                    assert.that(err instanceof Error, is.true());
                    done();
                });
            });
        });
    }
});