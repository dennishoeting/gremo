/**
 * User: DennisHoeting
 * Date: 27.04.13
 * Time: 17:48
 *
 * $
 */
angular.module('userModule', ['socketModule']).factory('User', function (WebSocketService) {
    var exports = {
        model: {
            self: {},
            communities: [],
            friends: []
        }
    };

    exports.getCopy = function () {
        return angular.copy(exports.model.self)
    };

    exports.getData = function () {
        var deferred = $.Deferred();
        WebSocketService.getFullUser()
            .then(function (userData) {
                exports.model.self = userData;
                return exports.getUserFriends();
            })
            .then(function () {
                return exports.getCommunities();
            })
            .done(function () {
                deferred.resolve();
            })
            .fail(function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    exports.save = function (userData) {
        var deferred = $.Deferred();
        WebSocketService.saveUser(userData)
            .done(function () {
                exports.model.self = angular.copy(userData);
                deferred.resolve();
            })
            .fail(function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    exports.savePassword = function (passwordData) {
        var deferred = $.Deferred();
        WebSocketService.changePassword(passwordData)
            .done(function () {
                deferred.resolve();
            })
            .fail(function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    exports.joinCommunity = function (communityId) {
        var deferred = $.Deferred();
        WebSocketService.joinCommunity({communityId: communityId})
            .done(function (accepted) {
                return exports.getCommunities()
                    .done(function () {
                        deferred.resolve(accepted);
                    });
            })
            .fail(function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    exports.leaveCommunity = function (communityId) {
        var deferred = $.Deferred();
        WebSocketService.leaveCommunity({communityId: communityId})
            .done(function (result) {
                return exports.getCommunities()
                    .done(function (result) {
                        deferred.resolve(result);
                    });
            })
            .fail(function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    exports.getCommunities = function () {
        var deferred = $.Deferred();
        WebSocketService.getUserCommunities()
            .done(function (result) {
                exports.model.communities = result;
                deferred.resolve();
            })
            .fail(function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    exports.getUserFriends = function () {
        var deferred = $.Deferred();
        WebSocketService.getUserFriends()
            .done(function (friends) {
                exports.model.friends = friends;
                deferred.resolve();
            })
            .fail(function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    return exports;
});