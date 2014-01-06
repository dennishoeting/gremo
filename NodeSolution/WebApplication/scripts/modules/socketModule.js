/**
 * Created with JetBrains WebStorm.
 * User: DennisHoeting
 * Date: 09.04.13
 * Time: 18:37
 * To change this template use File | Settings | File Templates.
 */
angular.module('socketModule', []).factory('WebSocketService', function () {
    var exports = {};

    var socket = null;

    exports.connect = function (connectParameter) {
        socket = io.connect();

        socket.on('connect', function () {
            socket.emit('identification', {userType: connectParameter.type, userId: connectParameter.id}, function (err, result) {
                typeof connectParameter.onIdentification === 'function' && connectParameter.onIdentification(result);
            });

            typeof connectParameter.onConnect === 'function' && connectParameter.onConnect();
        });

        exports.registerWebSocketListener = function (listeners) {
            _.forEach(listeners, function (listener) {
                socket.on(listener.event, function (data) {
                    listener.func.apply(undefined, data);
                });
            });
        };

        /**
         * If userid = undefined, own user data is requested!
         * @param userid
         * @returns {*}
         */
        exports.getFullUser = function () {
            var deferred = $.Deferred();
            socket.emit('getFullUser', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getUserFriends = function () {
            var deferred = $.Deferred();
            socket.emit('getUserFriends', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getUserFriend = function (userquery) {
            var deferred = $.Deferred();
            socket.emit('getUserFriend', {userquery: userquery}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getFueltypes = function () {
            var deferred = $.Deferred();
            socket.emit('getFueltypes', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.saveUser = function (data) {
            var deferred = $.Deferred();

            socket.emit('saveUser', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.changePassword = function (data) {
            var deferred = $.Deferred();
            socket.emit('changePassword', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getActionList = function (data) {
            var deferred = $.Deferred();
            socket.emit('getActionList', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getActionData = function (data) {
            var deferred = $.Deferred();
            socket.emit('getActionData', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getLeaderboard = function (data) {
            var deferred = $.Deferred();
            socket.emit('getLeaderboard', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getGroupLeaderboard = function (data) {
            var deferred = $.Deferred();
            socket.emit('getGroupLeaderboard', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getMessages = function (data) {
            var deferred = $.Deferred();
            socket.emit('getMessages', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.markMessageAsRead = function (data) {
            var deferred = $.Deferred();
            socket.emit('markMessageAsRead', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.joinCommunity = function (data) {
            var deferred = $.Deferred();
            socket.emit('joinCommunity', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.leaveCommunity = function (data) {
            var deferred = $.Deferred();
            socket.emit('leaveCommunity', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.acceptJoinRequest = function (referenceId) {
            var deferred = $.Deferred();
            socket.emit('acceptJoinRequest', {referenceId: referenceId}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.rejectJoinRequest = function (referenceId) {
            var deferred = $.Deferred();
            socket.emit('rejectJoinRequest', {referenceId: referenceId}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getUserCommunities = function () {
            var deferred = $.Deferred();
            socket.emit('getUserCommunities', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getCommunity = function (communityId) {
            var deferred = $.Deferred();
            socket.emit('getCommunity', {communityId: communityId}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getCommunityList = function (data) {
            var deferred = $.Deferred();
            socket.emit('getCommunityList', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getUserList = function (data) {
            var deferred = $.Deferred();
            socket.emit('getUserList', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getCommunityTypes = function (data) {
            var deferred = $.Deferred();
            socket.emit('getCommunityTypes', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.addCommunity = function (data) {
            var deferred = $.Deferred();
            socket.emit('addCommunity', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.resetPassword = function (data) {
            var deferred = $.Deferred();
            socket.emit('resetPassword', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.pushLockedZone = function (data) {
            var deferred = $.Deferred();
            socket.emit('pushLockedZone', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getLockedZones = function () {
            var deferred = $.Deferred();
            socket.emit('getLockedZones', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.deleteLockedZone = function (data) {
            var deferred = $.Deferred();
            socket.emit('deleteLockedZone', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.alterLockedZone = function (data) {
            var deferred = $.Deferred();
            socket.emit('alterLockedZone', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.deleteData = function (data) {
            var deferred = $.Deferred();
            socket.emit('deleteData', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.anonymizeData = function (data) {
            var deferred = $.Deferred();
            socket.emit('anonymizeData', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.makeFriendRequest = function (data) {
            var deferred = $.Deferred();
            socket.emit('makeFriendRequest', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.sendMessage = function (data) {
            var deferred = $.Deferred();
            socket.emit('sendMessage', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.uploadTrack = function (data) {
            var deferred = $.Deferred();
            socket.emit('uploadTrack', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.deleteMessage = function (data) {
            var deferred = $.Deferred();
            socket.emit('deleteMessage', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.sendFeedback = function (data) {
            var deferred = $.Deferred();
            socket.emit('sendFeedback', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.sendContact = function (data) {
            var deferred = $.Deferred();
            socket.emit('sendContact', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.deleteAccount = function (data) {
            var deferred = $.Deferred();
            socket.emit('deleteAccount', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.donateTrack = function (data) {
            var deferred = $.Deferred();
            socket.emit('donateTrack', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.sendSweepstakeCredentials = function (data) {
            var deferred = $.Deferred();
            socket.emit('sendSweepstakeCredentials', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.confirmNotification = function () {
            var deferred = $.Deferred();
            socket.emit('confirmNotification', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };
    };

    return exports;
});