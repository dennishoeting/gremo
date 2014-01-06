/**
 * User: DennisHoeting
 * Date: 09.05.13
 * Time: 13:14
 *
 * $
 */

var validator = require('./../controllers/inputValidationCtrl.js');

module.exports.WebSocketHandler = (function () {
    var webSocketClient = undefined;
    var clients = undefined;
    var clientCodesPerId = undefined;
    var clientIdsPerCode = undefined;
    var smtpCtrl = undefined;
    var cryptCtrl = undefined;
    var logger = undefined;

    var unknownSocketId = -10;

    function WebSocketHandler(configs) {
        webSocketClient = configs.webSocketClient;
        clients = configs.clients;
        clientCodesPerId = configs.clientCodesPerId;
        clientIdsPerCode = configs.clientCodesPerCode;
        smtpCtrl = configs.smtpCtrl;
        cryptCtrl = configs.cryptCtrl;
        logger = configs.logger;
    }


    WebSocketHandler.prototype.sendFeedback = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                smtpCtrl.sendFeedbackMail(data)
                    .then(function () {
                        callback(null, true);
                    })
                    .fail(function (error) {
                        logger.info('webSocketHdl.js: ', error);
                        callback(error);
                    });
            })
            .fail(function (err) {
                callback(err);
            });

    };

    WebSocketHandler.prototype.sendContact = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                smtpCtrl.sendContactMail(data)
                    .then(function () {
                        callback(null, true);
                    })
                    .fail(function (error) {
                        logger.info('webSocketHdl.js: ', error);
                        callback(error);
                    });
            })
            .fail(function (err) {
                callback(err);
            });
    };


    WebSocketHandler.prototype.identification = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                var id = clientIdsPerCode[data.userId] || unknownSocketId--;
                var type = data.userType || 'unknown';
                socket.userId = id;
                socket.userType = type;
                clients[id] = socket;

                typeof callback === 'function' && callback(true);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getFullUser = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('getFullUser', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getUserFriends = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('getUserFriends', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getUserFriend = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('getUserFriend', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getFueltypes = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getFueltypes', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.saveUser = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('saveUser', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.changePassword = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                if (data.pw1 == data.pw2) {
                    webSocketClient.emit('changePassword', data, callback);
                } else {
                    return callback(new Error('Passwords don\'t match.'));
                }
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.resetPassword = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.code = cryptCtrl.getPasswordCode(data.password);
                webSocketClient.emit('resetPassword', data, function (err, result) {
                    if (err) {
                        return callback(err);
                    } else {
                        smtpCtrl.sendResetPasswordMail({
                            password: data.password,
                            code: data.code,
                            to: data.email})
                            .then(function () {
                                return callback(null, true);
                            })
                            .fail(function () {
                                return callback(err);
                            });
                    }
                });
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getActionList = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('getActionList', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getActionData = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('getActionData', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getLeaderboard = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('getLeaderboard', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getGroupLeaderboard = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                logger.info('webSocketHdl.js: client hdl');
                webSocketClient.emit('getGroupLeaderboard', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getMessages = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('getMessages', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.markMessageAsRead = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('markMessageAsRead', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.joinCommunity = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('joinCommunity', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.leaveCommunity = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('leaveCommunity', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.acceptJoinRequest = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('acceptJoinRequest', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.rejectJoinRequest = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('rejectJoinRequest', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getUserCommunities = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('getUserCommunities', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getCommunityList = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getCommunityList', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getUserList = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getUserList', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getCommunity = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getCommunity', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.getCommunityTypes = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getCommunityTypes', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.addCommunity = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('addCommunity', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.pushLockedZone = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('pushLockedZone', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getLockedZones = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('getLockedZones', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.deleteLockedZone = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('deleteLockedZone', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.alterLockedZone = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('alterLockedZone', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.deleteData = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('deleteData', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.anonymizeData = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('anonymizeData', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.makeFriendRequest = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('makeFriendRequest', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.sendMessage = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('sendMessage', data, function (err, result) {
                    if (clients[data.to]) {
                        clients[data.to].emit('userMessage');
                    }
                    callback(err, result);
                });
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.uploadTrack = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('uploadTrack', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.deleteMessage = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('deleteMessage', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.deleteAccount = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('deleteAccount', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.donateTrack = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('donateTrack', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.sendSweepstakeCredentials = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('sendSweepstakeCredentials', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    WebSocketHandler.prototype.confirmNotification = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                data.userId = socket.userId;
                webSocketClient.emit('confirmNotification', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };


    /*
     * ADMIN
     */
    //TODO test
    WebSocketHandler.prototype.getInductionLoops = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getInductionLoops', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getInductionLoopTypes = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getInductionLoopTypes', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getInductionLoopGroups = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getInductionLoopGroups', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.createInductionLoop = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('createInductionLoop', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getBluetoothSensors = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getBluetoothSensors', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getWifiRouters = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getWifiRouters', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.uploadCSV = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('uploadCSV', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    // TODO test
    WebSocketHandler.prototype.calculateBluetoothRatio = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('calculateBluetoothRatio', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.loadActions = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('loadActions', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };


    // TODO test
    WebSocketHandler.prototype.getOnlineUsers = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                var result = [];
                for (var id in clients) {
                    if (clients.propertyIsEnumerable(id)) {
                        result.push({id: id, code: clients[id].id, type: clients[id].userType});
                    }
                }
                callback(undefined, result);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getAllUsers = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getAllUsers', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getAllCommunities = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getAllCommunities', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.calculateBluetoothTracks = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('calculateBluetoothTracks', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    //TODO test
    WebSocketHandler.prototype.getMotionData = function (socket, data, callback) {
        validator.validate(data)
            .then(function (data) {
                webSocketClient.emit('getMotionData', data, callback);
            })
            .fail(function (err) {
                callback(err);
            });
    };

    return WebSocketHandler;
})();