/**
 * User: DennisHoeting
 * Date: 04.06.13
 * Time: 18:28
 *
 * $
 */

angular.module('statisticsModule', ['socketModule']).factory('Statistics', function (WebSocketService) {
    var exports = {
        model : {
            leaderboard : [],
            groupLeaderboard : [],
            amount : 10
        }
    };

    exports.getData = function () {
        var deferred = $.Deferred();
        WebSocketService.getLeaderboard({size: exports.model.amount})
            .then(function (result) {
                exports.model.leaderboard = result;
                return WebSocketService.getGroupLeaderboard({size: exports.model.amount});
            })
            .done(function (result) {
                exports.model.groupLeaderboard = result;
                deferred.resolve();
            })
            .fail(function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    return exports;
});