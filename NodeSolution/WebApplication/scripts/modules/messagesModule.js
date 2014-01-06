/**
 * User: DennisHoeting
 * Date: 05.06.13
 * Time: 15:15
 *
 * $
 */

angular.module('messagesModule', ['socketModule']).factory('Messages', function (WebSocketService) {
    var exports = {
        model: {
            messages: [],
            amount: 'ALL',
            //amount: 10,
            unreadMessages: 0
        }
    };

    exports.getData = function () {
        var deferred = $.Deferred();
        exports.model.messages = [];
        exports.model.unreadMessages = 0;
        WebSocketService.getMessages({size: exports.model.amount})
            .done(function (result) {
                _.forEach(result, function (message) {
                    if (!message.read) {
                        exports.model.unreadMessages++;
                    }
                });

                exports.model.messages = result;
                deferred.resolve();
            });
        return deferred.promise();
    };

    exports.markAsRead = function (id) {
        var deferred = $.Deferred();
        WebSocketService.markMessageAsRead({messageId: id})
            .done(function () {
                exports.model.unreadMessages--;
                deferred.resolve();
            })
            .fail(function (error) {
                console.log('messagesModule.js: ', error);
                deferred.reject(error);
            });
        return deferred.promise();
    };

    exports.delete = function (id) {
        var deferred = $.Deferred();
        WebSocketService.deleteMessage({messageId: id})
            .done(function () {
                deferred.resolve();
            })
            .fail(function (error) {
                console.log('messagesModule.js: ', error);
                deferred.reject(error);
            });
        return deferred.promise();
    };

    return exports;
});