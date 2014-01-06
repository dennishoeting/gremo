/**
 * User: DennisHoeting
 * Date: 02.06.13
 * Time: 12:39
 *
 * $
 */


angular.module('adminSocketModule', []).factory('AdminSocketService', function () {
    var exports = {};

    var socket = null;

    exports.connect = function (connectParameter) {
        socket = io.connect();

        socket.on('connect', function () {
            typeof connectParameter.onConnect === 'function' && connectParameter.onConnect();
        });

        exports.getOnlineUsers = function () {
            var deferred = $.Deferred();
            socket.emit('getOnlineUsers', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getAllUsers = function (data) {
            var deferred = $.Deferred();
            socket.emit('getAllUsers', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getAllCommunities = function (data) {
            var deferred = $.Deferred();
            socket.emit('getAllCommunities', data, function (err, result) {
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

        exports.saveWifiRouter = function (data, callback) {
            socket.emit('saveWifiRouter', data, callback);
        };

        exports.loadActions = function (data) {
            var deferred = $.Deferred();
            socket.emit('loadActions', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getInductionLoopTypes = function () {
            var deferred = $.Deferred();
            socket.emit('getInductionLoopTypes', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getInductionLoopGroups = function () {
            var deferred = $.Deferred();
            socket.emit('getInductionLoopGroups', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getInductionLoops = function () {
            var deferred = $.Deferred();
            socket.emit('getInductionLoops', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.calculateBluetoothRatio = function (data) {
            var deferred = $.Deferred();
            socket.emit('calculateBluetoothRatio', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.createInductionLoop = function (data) {
            var deferred = $.Deferred();
            socket.emit('createInductionLoop', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.uploadCSV = function (data) {
            var deferred = $.Deferred();
            socket.emit('uploadCSV', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getBluetoothSensors = function () {
            var deferred = $.Deferred();
            socket.emit('getBluetoothSensors', {}, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getWifiRouters = function (data) {
            var deferred = $.Deferred();
            socket.emit('getWifiRouters', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.calculateBluetoothTracks = function (data) {
            var deferred = $.Deferred();
            socket.emit('calculateBluetoothTracks', data, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise();
        };

        exports.getMotionData = function (data) {
            var deferred = $.Deferred();
            socket.emit('getMotionData', data, function (err, result) {
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