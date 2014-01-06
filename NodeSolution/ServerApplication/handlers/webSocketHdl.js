/**
 * User: DennisHoeting
 * Date: 16.04.13
 * Time: 10:46
 *
 * Module for web socket actions.
 * Actions which are bound to event names are encapsulated in this class.
 */

/*
 * Module
 */
module.exports.WSHandler = (function () {
    var databaseCtrl = undefined;
    var logger = undefined;
    var dataFactory = undefined;

    var util = require('util');

    var kmlParser = undefined;
    var csvParser = undefined;
    var fileWriter = undefined;

    function WSHandler(configs) {
        databaseCtrl = configs.databaseCtrl;
        logger = configs.logger;
        dataFactory = configs.dataFactory;
        kmlParser = configs.kmlParser;
        csvParser = configs.csvParser;
        fileWriter = configs.fileWriter;
    }

    /**
     * Register a new user
     * @param data
     * @param callback
     */
    WSHandler.prototype.register = function (data, callback) {
        logger.info('WebSocketHandler register data: ', data);

        dataFactory.validateRegistrationData(data)
            .then(function (validData) {
                return databaseCtrl.register(validData);
            })
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WSHandler.prototype.openRegister = function (data, callback) {
        logger.info('WebSocketHandler openRegister data: ', data);

        dataFactory.validateOpenRegistrationData(data)
            .then(function (validData) {
                return databaseCtrl.openRegister(validData);
            })
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * Get a user
     * @param data Object with user request information (username+password or id)
     * @param callback Callback to be invoked
     */
    WSHandler.prototype.login = function (data, callback) {
        logger.info('WebSocketHandler login data: ', data);

        /*
         * Username and password are provided
         * Request at database
         */
        dataFactory.validateLoginData(data)
            .then(function (validData) {
                return databaseCtrl.login(validData);
            })
            .then(function (user) {
                if (user && user.isactive) {
                    callback(null, user);
                } else {
                    callback(new Error('User not activated'));
                }
            })
            .fail(function (err) {
                console.log('webSocketHdl.js: rej');
                console.log('webSocketHdl.js: ', err);
                callback(err);
            });
    };

    WSHandler.prototype.getFueltypes = function (data, callback) {
        // data is empty
        logger.info('WebSocketHandler getFueltypes');

        databaseCtrl.getFueltypes()
            .then(function (result) {
                callback(undefined, result);
            })
            .fail(function (err) {
                callback(err, false);
            });
    };

    WSHandler.prototype.activate = function (data, callback) {
        logger.info('WebSocketHandler activate data: ', data);

        databaseCtrl.activate(data)
            .then(function (result) {
                callback(undefined, result);
            })
            .fail(function (err) {
                callback(err, false);
            });
    };



    WSHandler.prototype.getUserFriends = function (data, callback) {
        logger.info('WebSocketHandler getUserFriends data: ', data);

        databaseCtrl.getUserFriends(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getUserFriend = function (data, callback) {
        logger.info('WebSocketHandler getUserFriend data: ', data);

        var friend = undefined;
        databaseCtrl.getUserFriend(data)
            .then(function (result) {
                friend = result;
                return databaseCtrl.getUserCommunities({userId: friend.id});
            })
            .then(function (list) {
                friend.communityList = list;
                return databaseCtrl.getUserFriends({userId: friend.id})
            })
            .then(function (list) {
                friend.friendList = list;
                callback(null, friend);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    // deprecated
    /*
    WSHandler.prototype.getFullUser = function (data, callback) {
        logger.info('WebSocketHandler getFullUser data: ', data);

        databaseCtrl.getFullUser(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };
    */

    WSHandler.prototype.getFullUser = function (data, callback) {
        logger.info('WebSocketHandler getFullUser data: ', data);

        // own user
        if (!data.userquery) {
            databaseCtrl.getFullUser(data)
                .then(function (result) {
                    callback(null, result);
                })
                .fail(function (err) {
                    callback(err);
                });
        } else {
            databaseCtrl.getUserFriend(data)
                .then(function (result) {
                    callback(null, result);
                })
                .fail(function (err) {
                    callback(err);
                });
        }
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.saveUser = function (data, callback) {
        logger.info('WebSocketHandler saveUser data: ', data);

        databaseCtrl.saveUser(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.changePassword = function (data, callback) {
        logger.info('WebSocketHandler changePassword data: ', data);

        databaseCtrl.changePassword(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.resetPassword = function (data, callback) {
        logger.info('WebSocketHandler resetPassword data: ', data);

        databaseCtrl.resetPassword(data)
            .then(function () {
                callback(null, true);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.confirmPasswordReset = function (data, callback) {
        logger.info('WebSocketHandler confirmPasswordReset data: ', data);

        databaseCtrl.confirmPasswordReset(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getLeaderboard = function (data, callback) {
        logger.info('WebSocketHandler getLeaderboard data: ', data);

        databaseCtrl.getLeaderboard(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getGroupLeaderboard = function (data, callback) {
        logger.info('WebSocketHandler getGroupLeaderboard data: ', data);

        databaseCtrl.getGroupLeaderboard(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getMessages = function (data, callback) {
        logger.info('WebSocketHandler getMessages data: ', data);

        databaseCtrl.getMessages(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.markMessageAsRead = function (data, callback) {
        logger.info('WebSocketHandler markMessageAsRead data: ', data);

        databaseCtrl.markMessageAsRead(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.joinCommunity = function (data, callback) {
        logger.info('WebSocketHandler joinCommunity data: ', data);

        databaseCtrl.joinCommunity(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.leaveCommunity = function (data, callback) {
        logger.info('WebSocketHandler leaveCommunity data: ', data);

        databaseCtrl.leaveCommunity(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.acceptJoinRequest = function (data, callback) {
        logger.info('WebSocketHandler acceptJoinRequest data: ', data);

        databaseCtrl.acceptJoinRequest(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.rejectJoinRequest = function (data, callback) {
        logger.info('WebSocketHandler rejectJoinRequest data: ', data);

        databaseCtrl.rejectJoinRequest(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getUserCommunities = function (data, callback) {
        logger.info('WebSocketHandler getUserCommunities data: ', data);

        databaseCtrl.getUserCommunities(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getCommunityList = function (data, callback) {
        logger.info('WebSocketHandler getCommunityList data: ', data);

        databaseCtrl.getCommunityList(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getUserList = function (data, callback) {
        logger.info('WebSocketHandler getUserList data: ', data);

        databaseCtrl.getUserList(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getCommunity = function (data, callback) {
        logger.info('WebSocketHandler getCommunity data: ', data);

        var community = undefined;
        databaseCtrl.getCommunity(data)
            .then(function (result) {
                community = result;
                console.log('webSocketHdl.js: ', result);
                return databaseCtrl.getCommunityMembers({communityId: community.id});
            })
            .then(function (list) {
                console.log('webSocketHdl.js: ', list);
                community.memberList = list;
                callback(null, community);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getActionList = function (data, callback) {
        logger.info('WebSocketHandler getActionList data: ', data);

        databaseCtrl.getActionList(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getActionData = function (data, callback) {
        logger.info('WebSocketHandler getActionData data: ', data);

        var actionDataResult,
            lineResult,
            gpsResult,
            wifiResult,
            bluetoothResult,
            motionResult;

        databaseCtrl.getActionData(data)
            .then(function (result) {
                actionDataResult = result
                return databaseCtrl.getActionDataLine(data);
            })
            .then(function (result) {
                lineResult = result;
                return databaseCtrl.getGPSDataForAction(data);
            })
            .then(function (result) {
                gpsResult = result;
                return databaseCtrl.getWifiRouterDetectionForAction(data);
            })
            .then(function (result) {
                wifiResult = result;
                return databaseCtrl.getBluetoothSensorDetectionForAction(data);
            })
            .then(function (result) {
                bluetoothResult = result;
                return databaseCtrl.getMotionDataForAction(data);
            })
            .then(function (result) {
                motionResult = result;
                callback(null, {
                    actiondata: actionDataResult,
                    linedata: lineResult,
                    gpsdata: gpsResult,
                    wifidata: wifiResult,
                    bluetoothdata: bluetoothResult,
                    motiondata: motionResult
                });
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getAllUsers = function (data, callback) {
        logger.info('WebSocketHandler getAllUsers data: ', data);

        databaseCtrl.getAllUsers(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getWifiRouters = function (data, callback) {
        logger.info('WebSocketHandler getWifiRouters data: ', data);

        databaseCtrl.getWifiRouters(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.addCommunityType = function (data, callback) {
        logger.info('WebSocketHandler addCommunityType data: ', data);

        databaseCtrl.addCommunityType(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.getCommunityTypes = function (data, callback) {
        logger.info('WebSocketHandler getCommunityTypes data: ', data);

        databaseCtrl.getCommunityTypes(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.addCommunity = function (data, callback) {
        logger.info('WebSocketHandler addCommunity data: ', data);

        databaseCtrl.addCommunity(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.getAllCommunities = function (data, callback) {
        logger.info('WebSocketHandler getAllCommunities data: ', data);

        databaseCtrl.getAllCommunities(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.pushLockedZone = function (data, callback) {
        logger.info('WebSocketHandler pushLockedZone data: ', data);

        databaseCtrl.pushLockedZone(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.getLockedZones = function (data, callback) {
        logger.info('WebSocketHandler getLockedZones data: ', data);

        databaseCtrl.getLockedZones(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.deleteLockedZone = function (data, callback) {
        logger.info('WebSocketHandler deleteLockedZone data: ', data);

        databaseCtrl.deleteLockedZone(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    /**
     * @param data
     * @param callback
     */
    WSHandler.prototype.alterLockedZone = function (data, callback) {
        logger.info('WebSocketHandler alterLockedZone data: ', data);

        databaseCtrl.alterLockedZone(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.deleteData = function (data, callback) {
        logger.info('WebSocketHandler deleteData data: ', data);

        databaseCtrl.deleteData(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.anonymizeData = function (data, callback) {
        logger.info('WebSocketHandler anonymizeData data: ', data);

        databaseCtrl.anonymizeData(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.makeFriendRequest = function (data, callback) {
        logger.info('WebSocketHandler makeFriendRequest data: ', data);

        databaseCtrl.makeFriendRequest(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.sendMessage = function (data, callback) {
        logger.info('WebSocketHandler sendMessage data: ', data);

        databaseCtrl.sendMessage(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.uploadTrack = function (data, callback) {
        logger.info('WebSocketHandler uploadTrack data: ', data);

        var newActionId;
        fileWriter.write('UploadedTrack'
                + '_tst' + new Date().getTime()
                + '_usr' + data.userId
                + '_typ' + data.actionType
                + data.ext,
                data.file)
            .then(function () {
                return kmlParser.readFile(data.file);
            })
            .then(function () {
                return kmlParser.parseToGPSDataArray(data.userId);
            })
            .then(function (bulk) {
                if (bulk.length < 2) {
                    throw new Error('Parsing resulted in empty bulk.');

                } else {
                    return databaseCtrl.pushAction({
                        userId: data.userId,
                        typeId: data.actionType
                    })
                        .then(function (result) {
                            newActionId = result;
                            return databaseCtrl.pushGpsData(bulk);
                        })
                        .then(function () {
                            return databaseCtrl.endUploadedAction({
                                userId: data.userId
                            })
                        })
                }
            })
            .then(function () {
                callback(undefined, newActionId);
            })
            .fail(function (error) {
                callback(error);
            });
    };

    WSHandler.prototype.deleteMessage = function (data, callback) {
        logger.info('WebSocketHandler deleteMessage data: ', data);

        databaseCtrl.deleteMessage(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.deleteAccount = function (data, callback) {
        logger.info('WebSocketHandler deleteAccount data: ', data);

        databaseCtrl.deleteAccount(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.donateTrack = function (data, callback) {
        logger.info('WebSocketHandler donateTrack data: ', data);

        fileWriter.write('DonatedTrack' + '_tst' + new Date().getTime() + '_rnd' + parseInt(Math.random() * 10000) + data.ext,
                data.file)
            .then(function () {
                callback(null, true);
            })
            .fail(function (err) {
                callback(err);
            })
    };

    WSHandler.prototype.sendSweepstakeCredentials = function (data, callback) {
        logger.info('WebSocketHandler sendSweepstakeCredentials data: ', data);

        databaseCtrl.insertSweepstakeCredentials(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.confirmNotification = function (data, callback) {
        logger.info('WebSocketHandler confirmNotification data: ', data);

        databaseCtrl.confirmNotification(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };


    /*
     * Admin
     */
    WSHandler.prototype.getInductionLoops = function (data, callback) {
        logger.info('WebSocketHandler getInductionLoops data: ', data);

        databaseCtrl.getInductionLoops(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getInductionLoopTypes = function (data, callback) {
        logger.info('WebSocketHandler getInductionLoopTypes data: ', data);

        databaseCtrl.getInductionLoopTypes(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getInductionLoopGroups = function (data, callback) {
        logger.info('WebSocketHandler getInductionLoopGroups data: ', data);

        databaseCtrl.getInductionLoopGroups(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.createInductionLoop = function (data, callback) {
        logger.info('WebSocketHandler createInductionLoop data: ', data);

        databaseCtrl.createInductionLoop(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getBluetoothSensors = function (data, callback) {
        logger.info('WebSocketHandler getBluetoothSensors data: ', data);

        databaseCtrl.getBluetoothSensors(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.uploadCSV = function (data, callback) {
        logger.info('WebSocketHandler uploadCSV data: (a lot...)');

        csvParser.parse(data.file)
            .then(function (result) {
                return databaseCtrl.pushInductionLoopData(result);
            })
            .then(function (result) {
                console.log('webSocketHdl.js: ', result);
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.calculateBluetoothRatio = function (data, callback) {
        logger.info('WebSocketHandler calculateBluetoothRatio data: ', data);

        databaseCtrl.calculateBluetoothRatio(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.loadActions = function (data, callback) {
        logger.info('WebSocketHandler loadActions data: ', data);

        databaseCtrl.loadActions(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.calculateBluetoothTracks = function (data, callback) {
        logger.info('WebSocketHandler calculateBluetoothTracks data: ', data);

        databaseCtrl.calculateBluetoothTracks(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WSHandler.prototype.getMotionData = function (data, callback) {
        logger.info('WebSocketHandler getMotionData data: ', data);

        databaseCtrl.getMotionData(data)
            .then(function (result) {
                callback(null, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    return WSHandler;
})();